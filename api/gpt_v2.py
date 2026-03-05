"""
GPT V2 Module - Agentic Resume Generation with Anti-Hallucination

This module provides a flexible LLM client that works with any OpenAI-compatible API:
- OpenAI API
- UF Navigator Toolkit
- Azure OpenAI
- Local models (Ollama, vLLM, etc.)

Configure via environment variables:
- LLM_BASE_URL: API base URL (default: https://api.openai.com/v1)
- LLM_API_KEY: API key (falls back to OPENAI_KEY or OPENAI_API_KEY)
- LLM_MODEL: Model name (default: gpt-4o-mini)
"""

import os
import json
import re
import time
import base64
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, asdict
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env", override=True)


def parse_json_response(content: str) -> dict:
    """
    Parse JSON from LLM response, handling various formats.
    Some providers don't support json_object mode and return markdown code blocks.
    """
    # First try direct parse
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Try to extract JSON from markdown code block
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass

    # Try to find JSON object in the content
    json_match = re.search(r'\{[\s\S]*\}', content)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass

    # Try to find JSON array in the content
    json_match = re.search(r'\[[\s\S]*\]', content)
    if json_match:
        try:
            return {"items": json.loads(json_match.group(0))}
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from response: {content[:200]}")


_ENV_PATH = Path(os.path.abspath(__file__)).parent / ".env"

def get_llm_client() -> OpenAI:
    """Create an OpenAI-compatible client based on environment configuration."""
    load_dotenv(_ENV_PATH, override=True)
    base_url = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1")
    api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_KEY") or os.getenv("OPENAI_API_KEY")
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    print(f"[gpt_v2.py] get_llm_client: env_path={_ENV_PATH}, base_url={base_url}, model={model}, key={'SET' if api_key else 'MISSING'}")

    if not api_key:
        raise ValueError("No API key found. Set LLM_API_KEY, OPENAI_KEY, or OPENAI_API_KEY environment variable.")

    return OpenAI(base_url=base_url, api_key=api_key)


def llm_call_with_retry(client, model, messages, response_format=None, max_retries=3, **kwargs):
    """Make an LLM API call with exponential backoff on rate limit / auth errors."""
    last_error = None
    for attempt in range(max_retries + 1):
        try:
            create_kwargs = {"model": model, "messages": messages, **kwargs}
            if response_format:
                create_kwargs["response_format"] = response_format
            return client.chat.completions.create(**create_kwargs)
        except Exception as e:
            last_error = e
            err_str = str(e).lower()
            is_retryable = any(x in err_str for x in ["401", "429", "auth", "rate", "connection", "timeout"])
            if attempt < max_retries and is_retryable:
                wait = 2 ** attempt  # 1s, 2s, 4s
                print(f"LLM call failed (attempt {attempt+1}), retrying in {wait}s: {e}")
                time.sleep(wait)
                # Refresh client in case of auth issue
                load_dotenv(Path(__file__).parent / ".env", override=True)
                client = get_llm_client()
                continue
            raise
    raise last_error


def get_model_name() -> str:
    """Get the model name from environment or use default."""
    return os.getenv("LLM_MODEL", "gpt-4o-mini")


# Pydantic-like dataclasses for structured outputs
@dataclass
class JobAnalysis:
    job_title: str
    job_field: str  # software, ai, data, management, engineering, sales, research, other
    years_required: int
    required_skills: List[str]
    preferred_skills: List[str]
    keywords: List[str]  # Top 20 keywords for ATS
    key_responsibilities: List[str]
    company_values: List[str]


@dataclass
class ClarifyingQuestionData:
    question_type: str  # metrics, verification, gap_filling
    target_entity: str  # experience, project
    target_id: int
    target_name: str  # Company name or project name for display
    question_text: str
    input_type: str  # text, number, radio, multiselect
    options: Optional[List[str]] = None
    context: Optional[str] = None  # Why this question matters


@dataclass
class PromptInstructions:
    question_focus: str      # What kinds of metrics/details matter for this role
    bullet_style: str        # How bullets should be framed for this role
    key_themes: List[str]    # Themes to emphasize (e.g. "scale", "cost reduction")
    avoid: List[str]         # Generic phrases to avoid for this specific role


@dataclass
class GeneratedBullet:
    target_id: int
    target_type: str  # experience, project
    original_text: str
    generated_text: str
    keywords_used: List[str]
    grounding_source: str  # What user data this came from


# Anti-hallucination system prompt
ANTI_HALLUCINATION_RULES = """
CRITICAL ANTI-HALLUCINATION RULES - YOU MUST FOLLOW THESE EXACTLY:

1. ONLY use information explicitly provided in the user's data
2. DO NOT invent metrics, percentages, or numbers unless the user provided them
3. DO NOT add technologies, tools, or skills the user hasn't mentioned
4. DO NOT fabricate achievements, awards, or outcomes
5. DO NOT assume team sizes, user counts, or impact numbers
6. If specific information is missing, write the bullet WITHOUT that detail - never guess
7. Use EXACT keywords from the job description for ATS optimization
8. Every claim must be directly traceable to the user's provided data
9. When in doubt, be conservative - less is better than fabricated
10. Preserve the user's actual accomplishments - just improve phrasing
"""


def fetch_github_readme(github_url: str, max_chars: int = 800) -> Optional[str]:
    """
    Fetch the README for a public GitHub repository.
    Returns the first max_chars of the README text, or None if unavailable.
    """
    try:
        # Extract owner/repo from URL patterns like:
        #   https://github.com/owner/repo
        #   https://github.com/owner/repo/tree/main/...
        match = re.search(r'github\.com/([^/]+)/([^/?#]+)', github_url)
        if not match:
            return None
        owner, repo = match.group(1), match.group(2).rstrip('.git')

        api_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
        req = urllib.request.Request(api_url, headers={"Accept": "application/vnd.github.v3+json", "User-Agent": "resume-builder"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())

        content = base64.b64decode(data["content"]).decode("utf-8", errors="replace")
        # Strip markdown noise: remove badges, HTML tags, code fences
        content = re.sub(r'```[\s\S]*?```', '', content)
        content = re.sub(r'<[^>]+>', '', content)
        content = re.sub(r'!\[.*?\]\(.*?\)', '', content)  # images
        content = re.sub(r'\[.*?\]\(.*?\)', lambda m: m.group(0).split(']')[0][1:], content)  # links → text
        content = re.sub(r'#+\s*', '', content)  # headings
        content = re.sub(r'\n{3,}', '\n\n', content).strip()
        return content[:max_chars]
    except Exception as e:
        print(f"[github] Could not fetch README for {github_url}: {e}")
        return None


def analyze_job_description(job_description: str) -> JobAnalysis:
    """
    Analyze a job description and extract structured information.
    Returns job field, required skills, keywords, and responsibilities.
    """
    client = get_llm_client()
    model = get_model_name()

    prompt = f"""Analyze the following job description and extract key information.

Job Description:
{job_description}

Return a JSON object with exactly these fields:
{{
    "job_title": "extracted or inferred job title",
    "job_field": "one of: software, ai, data, management, engineering, sales, research, other",
    "years_required": integer (0 if not specified),
    "required_skills": ["list", "of", "required", "skills"],
    "preferred_skills": ["list", "of", "nice-to-have", "skills"],
    "keywords": ["top", "20", "ATS", "keywords", "from", "the", "job", "description"],
    "key_responsibilities": ["main", "job", "responsibilities"],
    "company_values": ["any", "mentioned", "company", "values", "or", "culture", "points"]
}}

IMPORTANT:
- Keywords should be exact phrases from the job description for ATS matching
- Include technical skills, tools, methodologies, and soft skills in keywords
- Job field must be exactly one of the specified options
"""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON, no other text."}])

    result = parse_json_response(response.choices[0].message.content)

    return JobAnalysis(
        job_title=result.get("job_title", ""),
        job_field=result.get("job_field", "other"),
        years_required=result.get("years_required", 0),
        required_skills=result.get("required_skills", []),
        preferred_skills=result.get("preferred_skills", []),
        keywords=result.get("keywords", [])[:20],  # Limit to 20
        key_responsibilities=result.get("key_responsibilities", []),
        company_values=result.get("company_values", [])
    )


def generate_prompt_instructions(job_analysis: JobAnalysis) -> PromptInstructions:
    """
    Generate role-specific prompt instructions based on the job analysis.
    One fast call that customizes how questions and bullets are written for this exact role.
    """
    client = get_llm_client()
    model = get_model_name()

    prompt = f"""You are a resume strategy expert. Given this job analysis, define how to best present a candidate.

Job Title: {job_analysis.job_title}
Field: {job_analysis.job_field}
Key Responsibilities: {', '.join(job_analysis.key_responsibilities[:5])}
Required Skills: {', '.join(job_analysis.required_skills[:8])}
Company Values: {', '.join(job_analysis.company_values[:4])}

Return a JSON object with exactly these fields:
{{
    "question_focus": "1-2 sentence description of what metrics and details matter most for this role (e.g. 'Focus on scale of systems built, latency improvements, and team collaboration patterns')",
    "bullet_style": "1-2 sentence description of how bullets should be framed (e.g. 'Lead with technical depth and quantified system impact. Emphasize ownership and cross-functional work.')",
    "key_themes": ["3-5 themes to weave naturally into bullets — specific to this role, not generic"],
    "avoid": ["3-5 specific buzzwords or generic phrases that are cliche for this role type"]
}}"""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON."}])

    result = parse_json_response(response.choices[0].message.content)
    return PromptInstructions(
        question_focus=result.get("question_focus", "Focus on measurable impact and scope."),
        bullet_style=result.get("bullet_style", "Lead with action and quantified results."),
        key_themes=result.get("key_themes", []),
        avoid=result.get("avoid", [])
    )


def generate_clarifying_questions(
    job_analysis: JobAnalysis,
    experiences: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
    user_skills: str,
    max_questions: int = 8,
    prompt_instructions: Optional[PromptInstructions] = None
) -> List[ClarifyingQuestionData]:
    """
    Generate clarifying questions to gather metrics and verify claims.
    Questions help ground the resume content in real data.
    Uses option-based questions for better UX.
    """
    client = get_llm_client()
    model = get_model_name()

    # Build context about user's data — detect thin descriptions for gap filling
    gap_flags = []
    experiences_summary_parts = []
    for i, exp in enumerate(experiences):
        desc = exp.get('description', '') or ''
        word_count = len(desc.split())
        flag = ""
        if word_count < 20:
            flag = " [⚠ VERY SHORT description — prioritize gap_filling questions]"
            gap_flags.append(f"Experience {i} ({exp.get('position', '?')} at {exp.get('company', '?')}) has only {word_count} words")
        elif word_count < 50:
            flag = " [description is brief — consider gap_filling questions]"
        experiences_summary_parts.append(
            f"- ID {i}: {exp.get('position', 'Unknown')} at {exp.get('company', 'Unknown')}{flag}: {desc[:250]}"
        )
    experiences_summary = "\n".join(experiences_summary_parts)

    projects_summary_parts = []
    for i, proj in enumerate(projects):
        desc = proj.get('description', '') or ''
        word_count = len(desc.split())
        flag = ""
        if word_count < 15:
            flag = " [⚠ VERY SHORT — prioritize gap_filling]"
        readme = proj.get('readme_content', '')
        readme_snippet = f"\n  README: {readme[:300]}" if readme else ""
        projects_summary_parts.append(
            f"- ID {i}: {proj.get('name', 'Unknown')}{flag}: {desc[:200]}{readme_snippet}"
        )
    projects_summary = "\n".join(projects_summary_parts)

    # Role-specific guidance from prompt instructions
    role_guidance = ""
    if prompt_instructions:
        role_guidance = f"""
ROLE-SPECIFIC QUESTION STRATEGY:
{prompt_instructions.question_focus}
Key themes to probe for: {', '.join(prompt_instructions.key_themes)}
"""

    gap_context = ""
    if gap_flags:
        gap_context = f"""
⚠ DESCRIPTION GAPS DETECTED — Include gap_filling questions for:
{chr(10).join(gap_flags)}
"""

    prompt = f"""{ANTI_HALLUCINATION_RULES}

I need to generate a resume for this job:
Job Title: {job_analysis.job_title}
Field: {job_analysis.job_field}
Key Skills: {', '.join(job_analysis.required_skills[:10])}
Keywords: {', '.join(job_analysis.keywords[:15])}
{role_guidance}
{gap_context}
User's Experiences:
{experiences_summary}

User's Projects:
{projects_summary}

User's Skills: {user_skills}

Generate {max_questions} clarifying questions using ONLY option-based inputs (radio or multiselect).
This is for better UX - users should be able to click to answer, not type.

QUESTION TYPES AND OPTIONS:

1. METRICS questions - Use radio with predefined ranges:
   - Team size: ["Solo/Individual", "2-3 people", "4-6 people", "7-10 people", "10+ people"]
   - Impact percentage: ["Less than 10%", "10-25%", "25-50%", "50-100%", "More than 100%"]
   - User/customer count: ["Under 100", "100-1,000", "1,000-10,000", "10,000-100,000", "100,000+"]
   - Time saved: ["A few hours", "1-2 days", "A week", "Multiple weeks", "A month or more"]
   - Revenue/cost impact: ["Under $10K", "$10K-$50K", "$50K-$100K", "$100K-$500K", "$500K+"]

2. VERIFICATION questions - Use radio for role clarity:
   - Role type: ["Led the initiative", "Key contributor", "Team member", "Supporting role"]
   - Ownership: ["Sole owner", "Primary owner with support", "Shared ownership", "Contributor"]
   - Scope: ["Company-wide", "Department/Team", "Single project", "Feature-level"]

3. GAP FILLING questions - Use multiselect for technologies/methods:
   - Methodologies: ["Agile/Scrum", "Kanban", "Waterfall", "DevOps", "CI/CD", "TDD"]
   - Deployment: ["AWS", "GCP", "Azure", "On-premise", "Hybrid", "Docker/Kubernetes"]
   - Database types: ["SQL (PostgreSQL, MySQL)", "NoSQL (MongoDB, DynamoDB)", "Redis/Caching", "Data Warehouses"]
   - For short/vague descriptions: ask about what was actually built, the problem solved, or the outcome achieved

Return a JSON array of questions:
[
    {{
        "question_type": "metrics|verification|gap_filling",
        "target_entity": "experience|project",
        "target_id": integer (matching the ID above),
        "target_name": "Company Name or Project Name",
        "question_text": "Clear, concise question",
        "input_type": "radio|multiselect",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "context": "Why this helps (shown as hint)"
    }}
]

RULES:
- ONLY use "radio" or "multiselect" for input_type (NO "text" or "number")
- radio = single choice, multiselect = can pick multiple
- Provide 4-6 meaningful options for each question
- Options should cover common ranges/choices
- Include "Other/Not applicable" as last option when appropriate
- Make questions specific to the user's actual experiences
- Prioritize questions that align with job requirements
- For thin descriptions (flagged above), ask gap_filling questions that reveal what was actually done
"""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON, no other text."}])

    result = parse_json_response(response.choices[0].message.content)

    # Handle various response formats
    if isinstance(result, list):
        questions_data = result
    elif isinstance(result, dict):
        # Try common keys for the questions array
        questions_data = result.get("questions") or result.get("items") or result.get("data")
        if questions_data is None:
            # Maybe it's a dict of questions, get all values
            questions_data = list(result.values())
            if questions_data and isinstance(questions_data[0], list):
                questions_data = questions_data[0]
    else:
        questions_data = []

    # Ensure questions_data is a list
    if not isinstance(questions_data, list):
        questions_data = []

    questions = []
    for q in questions_data[:max_questions]:
        # Skip if q is not a dict
        if not isinstance(q, dict):
            continue
        questions.append(ClarifyingQuestionData(
            question_type=q.get("question_type", "metrics"),
            target_entity=q.get("target_entity", "experience"),
            target_id=q.get("target_id", 0),
            target_name=q.get("target_name", ""),
            question_text=q.get("question_text", ""),
            input_type=q.get("input_type", "text"),
            options=q.get("options"),
            context=q.get("context")
        ))

    return questions


def generate_grounded_bullets(
    job_analysis: JobAnalysis,
    entity_type: str,  # "experience" or "project"
    entity_data: Dict[str, Any],
    entity_id: int,
    user_answers: Dict[int, str],  # question_id -> answer
    relevant_questions: List[Dict[str, Any]],
    num_bullets: int = 3,
    prompt_instructions: Optional[PromptInstructions] = None
) -> List[GeneratedBullet]:
    """
    Generate resume bullet points that are STRICTLY grounded in user's actual data.
    No hallucinations - only rephrase and optimize what the user provided.
    """
    client = get_llm_client()
    model = get_model_name()

    # Build context from user's answers
    answers_context = ""
    for q in relevant_questions:
        q_id = q.get("id")
        if q_id in user_answers and user_answers[q_id]:
            answers_context += f"- {q.get('question_text', '')}: {user_answers[q_id]}\n"

    if entity_type == "experience":
        entity_context = f"""
Position: {entity_data.get('position', 'Unknown')}
Company: {entity_data.get('company', 'Unknown')}
Duration: {entity_data.get('start_date', '')} - {entity_data.get('end_date', 'Present' if entity_data.get('current') else '')}
Description: {entity_data.get('description', 'No description provided')}
"""
    else:  # project
        readme = entity_data.get('readme_content', '')
        readme_section = f"\nGitHub README (for additional context):\n{readme[:600]}" if readme else ""
        entity_context = f"""
Project Name: {entity_data.get('name', 'Unknown')}
Description: {entity_data.get('description', 'No description provided')}
Details: {entity_data.get('details', '')}
Link: {entity_data.get('link', '')}
Tech Stack: {entity_data.get('tech_stack', '')}{readme_section}
"""

    # Role-specific bullet guidance from prompt instructions
    bullet_guidance = ""
    themes_guidance = ""
    avoid_guidance = ""
    if prompt_instructions:
        bullet_guidance = f"BULLET STYLE FOR THIS ROLE: {prompt_instructions.bullet_style}"
        if prompt_instructions.key_themes:
            themes_guidance = f"Themes to weave in naturally (only if supported by user data): {', '.join(prompt_instructions.key_themes)}"
        if prompt_instructions.avoid:
            avoid_guidance = f"Avoid these overused phrases for this role type: {', '.join(prompt_instructions.avoid)}"

    prompt = f"""You are a professional resume writer. Write {num_bullets} concise, impactful bullet points for a resume.

TARGET ROLE: {job_analysis.job_title}

{entity_type.upper()} TO DESCRIBE:
{entity_context}

USER-PROVIDED DETAILS:
{answers_context if answers_context else "None provided"}

RELEVANT SKILLS/TECHNOLOGIES FOR THIS ROLE: {', '.join(job_analysis.required_skills[:8])}
{bullet_guidance}
{themes_guidance}
{avoid_guidance}

GUIDELINES:
- Write naturally — do NOT force keywords into every bullet
- Start each bullet with a strong, varied action verb (e.g. Built, Designed, Reduced, Improved, Automated, Collaborated)
- Mention technologies and skills only when they genuinely appear in the description above
- If the user provided metrics, use their exact numbers; otherwise describe scope/impact without inventing figures
- Each bullet should be 1-2 lines, specific, and achievement-oriented
- Sound like a human wrote it — avoid buzzword overload

STRICT RULES:
- Only reference what is explicitly in the data above — no invented details
- Do not add tools, frameworks, or outcomes the user did not mention
- Do not repeat the same action verb across bullets

Return JSON:
{{
    "bullets": [
        {{
            "text": "Bullet point text",
            "keywords_used": ["only", "naturally", "included", "ones"],
            "grounding_source": "Which part of the user data this came from"
        }}
    ]
}}
"""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON, no other text."}])

    result = parse_json_response(response.choices[0].message.content)
    bullets_data = result.get("bullets", []) if isinstance(result, dict) else []

    bullets = []
    original_text = entity_data.get('description', '') or entity_data.get('details', '')

    for bullet in bullets_data[:num_bullets]:
        if not isinstance(bullet, dict):
            continue
        bullets.append(GeneratedBullet(
            target_id=entity_id,
            target_type=entity_type,
            original_text=original_text,
            generated_text=bullet.get("text", ""),
            keywords_used=bullet.get("keywords_used", []),
            grounding_source=bullet.get("grounding_source", "user description")
        ))

    return bullets


def generate_skills_section(
    job_analysis: JobAnalysis,
    user_skills: str,
    job_field: str
) -> Dict[str, List[str]]:
    """
    Organize user's skills into categories, prioritizing job-relevant skills.
    Only uses skills the user actually has - no additions.
    """
    client = get_llm_client()
    model = get_model_name()

    # Field-specific skill categories
    skill_categories = {
        "software": ["Languages", "Frameworks & Libraries", "Tools & Platforms", "Databases"],
        "ai": ["ML/AI Frameworks", "Languages", "Tools & Platforms", "Techniques"],
        "data": ["Analytics Tools", "Languages", "Visualization", "Databases"],
        "management": ["Leadership", "Tools", "Methodologies", "Soft Skills"],
        "engineering": ["Technical Skills", "Tools", "Certifications", "Soft Skills"],
        "other": ["Technical Skills", "Tools", "Languages", "Other Skills"]
    }

    categories = skill_categories.get(job_field, skill_categories["other"])

    prompt = f"""{ANTI_HALLUCINATION_RULES}

Organize ONLY these skills into categories. DO NOT add any skills not in this list.

User's Skills: {user_skills}

Job Keywords (for ordering priority): {', '.join(job_analysis.keywords[:15])}

Categories to use: {', '.join(categories)}

Return a JSON object where keys are categories and values are arrays of skills:
{{
    "{categories[0]}": ["skill1", "skill2"],
    "{categories[1]}": ["skill3", "skill4"]
}}

CRITICAL:
- ONLY include skills from the user's list above
- Order skills within each category by relevance to the job (most relevant first)
- If a category has no matching skills, use an empty array
- DO NOT invent or add any skills not explicitly listed
"""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON, no other text."}])

    return parse_json_response(response.choices[0].message.content)


def calculate_relevance_score(
    job_analysis: JobAnalysis,
    entity_description: str
) -> int:
    """
    Calculate relevance score (0-100) of an experience/project to the job.
    Uses fast keyword-based heuristic instead of LLM calls for performance.
    """
    if not entity_description:
        return 0

    # Normalize text for matching
    description_lower = entity_description.lower()
    score = 0

    # Check required skills (40% weight, max 40 points)
    required_matches = sum(
        1 for skill in job_analysis.required_skills
        if skill.lower() in description_lower
    )
    max_required = len(job_analysis.required_skills) or 1
    score += int((required_matches / max_required) * 40)

    # Check keywords (30% weight, max 30 points)
    keyword_matches = sum(
        1 for keyword in job_analysis.keywords
        if keyword.lower() in description_lower
    )
    max_keywords = len(job_analysis.keywords) or 1
    score += int((keyword_matches / max_keywords) * 30)

    # Check preferred skills (15% weight, max 15 points)
    preferred_matches = sum(
        1 for skill in job_analysis.preferred_skills
        if skill.lower() in description_lower
    )
    max_preferred = len(job_analysis.preferred_skills) or 1
    score += int((preferred_matches / max_preferred) * 15)

    # Field relevance bonus (15% weight, max 15 points)
    field_terms = {
        "software": ["software", "developer", "engineer", "programming", "code", "api", "backend", "frontend", "fullstack"],
        "ai": ["machine learning", "ai", "ml", "deep learning", "neural", "nlp", "model", "tensorflow", "pytorch"],
        "data": ["data", "analytics", "sql", "database", "visualization", "etl", "pipeline", "warehouse"],
        "management": ["manager", "lead", "team", "strategy", "stakeholder", "project", "agile", "scrum"],
        "engineering": ["engineering", "technical", "system", "design", "architecture", "infrastructure"],
        "research": ["research", "publication", "study", "analysis", "experiment", "methodology"]
    }
    field_keywords = field_terms.get(job_analysis.job_field, [])
    field_matches = sum(1 for term in field_keywords if term in description_lower)
    max_field = len(field_keywords) or 1
    score += int((field_matches / max_field) * 15)

    return min(100, score)  # Cap at 100


def select_content_for_page_count(
    experiences: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
    job_analysis: JobAnalysis,
    page_count: int = 1
) -> Dict[str, Any]:
    """
    Select experiences and projects based on page count and relevance.
    1 page: 3 experiences, 2 projects
    2 pages: 5 experiences, 4 projects
    """
    # Score and sort experiences
    scored_experiences = []
    for i, exp in enumerate(experiences):
        desc = f"{exp.get('position', '')} at {exp.get('company', '')}: {exp.get('description', '')}"
        score = calculate_relevance_score(job_analysis, desc)
        # Boost current position
        if exp.get('current'):
            score += 10
        scored_experiences.append((score, i, exp))

    scored_experiences.sort(key=lambda x: x[0], reverse=True)

    # Score and sort projects
    scored_projects = []
    for i, proj in enumerate(projects):
        desc = f"{proj.get('name', '')}: {proj.get('description', '')} {proj.get('details', '')}"
        score = calculate_relevance_score(job_analysis, desc)
        scored_projects.append((score, i, proj))

    scored_projects.sort(key=lambda x: x[0], reverse=True)

    # Select based on page count
    if page_count == 1:
        max_exp, max_proj = 3, 2
        bullets_per_exp = [4, 2, 2]  # First exp gets more bullets
        bullets_per_proj = [3, 3]
    else:  # 2 pages
        max_exp, max_proj = 5, 4
        bullets_per_exp = [4, 3, 3, 2, 2]
        bullets_per_proj = [3, 3, 2, 2]

    selected_experiences = [
        {**exp, "_score": score, "_original_index": idx, "_bullets_count": bullets_per_exp[i] if i < len(bullets_per_exp) else 2}
        for i, (score, idx, exp) in enumerate(scored_experiences[:max_exp])
    ]

    selected_projects = [
        {**proj, "_score": score, "_original_index": idx, "_bullets_count": bullets_per_proj[i] if i < len(bullets_per_proj) else 2}
        for i, (score, idx, proj) in enumerate(scored_projects[:max_proj])
    ]

    return {
        "experiences": selected_experiences,
        "projects": selected_projects,
        "total_experiences": len(experiences),
        "total_projects": len(projects)
    }
