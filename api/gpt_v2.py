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
import requests as _requests
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
        headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "resume-builder"}
        token = os.getenv("GITHUB_TOKEN")
        if token:
            headers["Authorization"] = f"token {token}"
        resp = _requests.get(api_url, headers=headers, timeout=5)
        resp.raise_for_status()
        data = resp.json()

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
- Keywords must be SHORT (1-3 words each): tech skills, tools, languages, frameworks, methodologies
- Good examples: "Python", "React", "machine learning", "REST APIs", "CI/CD", "data pipelines"
- BAD examples (too long): "experience with large-scale distributed systems", "5+ years of Python development"
- Include technical skills, tools, methodologies, and domain terms — avoid full sentences or requirements
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


def _has_metrics(text: str) -> bool:
    """Return True if text already contains quantified metrics."""
    if not text:
        return False
    # Matches: percentages, multipliers (2x, 3x), large numbers (>99), dollar amounts
    return bool(re.search(r'\d+\s*[%x×+]|\$\s*\d+|\b[1-9]\d{2,}\b', text, re.IGNORECASE))


def generate_clarifying_questions(
    job_analysis: JobAnalysis,
    experiences: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
    user_skills: str,
    max_questions: int = 6,
    prompt_instructions: Optional[PromptInstructions] = None
) -> List[ClarifyingQuestionData]:
    """
    Generate clarifying questions to gather metrics and verify claims.
    Questions help ground the resume content in real data.
    Uses option-based questions for better UX.
    """
    client = get_llm_client()
    model = get_model_name()

    # Build context about user's data — detect thin descriptions and existing metrics
    gap_flags = []
    experiences_summary_parts = []
    for i, exp in enumerate(experiences):
        desc = exp.get('description', '') or ''
        word_count = len(desc.split())
        flags = []
        if word_count < 20:
            flags.append("⚠ VERY SHORT description — prioritize gap_filling questions")
            gap_flags.append(f"Experience {i} ({exp.get('position', '?')} at {exp.get('company', '?')}) has only {word_count} words")
        elif word_count < 50:
            flags.append("description is brief — consider gap_filling questions")
        if _has_metrics(desc):
            flags.append("has metrics: yes — SKIP metrics questions, ask verification or gap_filling only")
        else:
            flags.append("needs metrics: yes")
        flag_str = " [" + " | ".join(flags) + "]" if flags else ""
        experiences_summary_parts.append(
            f"- ID {i}: {exp.get('position', 'Unknown')} at {exp.get('company', 'Unknown')}{flag_str}: {desc[:250]}"
        )
    experiences_summary = "\n".join(experiences_summary_parts)

    projects_summary_parts = []
    for i, proj in enumerate(projects):
        desc = proj.get('description', '') or ''
        word_count = len(desc.split())
        flags = []
        if word_count < 15:
            flags.append("⚠ VERY SHORT — prioritize gap_filling")
        if _has_metrics(desc):
            flags.append("has metrics: yes — SKIP metrics questions")
        else:
            flags.append("needs metrics: yes")
        flag_str = " [" + " | ".join(flags) + "]" if flags else ""
        readme = proj.get('readme_content', '')
        readme_snippet = f"\n  README: {readme[:300]}" if readme else ""
        projects_summary_parts.append(
            f"- ID {i}: {proj.get('name', 'Unknown')}{flag_str}: {desc[:200]}{readme_snippet}"
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
- MAX 2 questions per entity (experience or project) — spread questions across different entities
- If an entity is tagged "has metrics: yes", DO NOT ask metrics questions for it — ask verification or gap_filling instead
- Do NOT ask the same question type (e.g., team size, impact percentage) more than once globally across all entities
- Prefer diversity: cover different entities and different question types
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
    seen_question_words: list = []
    entity_question_counts: dict = {}

    for q in questions_data:
        if not isinstance(q, dict):
            continue
        q_text = q.get("question_text", "").strip()
        if not q_text:
            continue

        # Cap per-entity questions at 2
        entity_key = (q.get("target_entity", ""), q.get("target_id", 0))
        if entity_question_counts.get(entity_key, 0) >= 2:
            continue

        # Word-overlap dedup: skip if >60% overlap with any seen question
        words = set(q_text.lower().split())
        is_dupe = any(
            len(words & prev) / max(len(words), len(prev)) > 0.60
            for prev in seen_question_words if prev
        )
        if is_dupe:
            continue

        questions.append(ClarifyingQuestionData(
            question_type=q.get("question_type", "metrics"),
            target_entity=q.get("target_entity", "experience"),
            target_id=q.get("target_id", 0),
            target_name=q.get("target_name", ""),
            question_text=q_text,
            input_type=q.get("input_type", "radio"),
            options=q.get("options"),
            context=q.get("context")
        ))
        seen_question_words.append(words)
        entity_question_counts[entity_key] = entity_question_counts.get(entity_key, 0) + 1

        if len(questions) >= max_questions:
            break

    return questions


def generate_grounded_bullets(
    job_analysis: JobAnalysis,
    entity_type: str,  # "experience" or "project"
    entity_data: Dict[str, Any],
    entity_id: int,
    user_answers: Dict[int, str],  # question_id -> answer
    relevant_questions: List[Dict[str, Any]],
    num_bullets: int = 3,
    prompt_instructions: Optional[PromptInstructions] = None,
    user_skill_keywords: Optional[List[str]] = None,  # JD keywords confirmed in user's skill profile
    entity_comment: Optional[str] = None,  # user-added context from SelectContentStep
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

    # Build user confirmed skills section
    skill_kw_section = ""
    if user_skill_keywords:
        skill_kw_section = f"""
CONFIRMED SKILLS FROM USER'S PROFILE MATCHING THIS JOB — YOU MUST weave these into the bullets:
{', '.join(user_skill_keywords)}
- These are technologies/skills the user CONFIRMED they have. They are fair game in bullets.
- Distribute them naturally across bullets. Do NOT dump all into one bullet.
- Use them when describing HOW the work was done (e.g. "built using Svelte", "deployed on Azure", "styled with Tailwind CSS")
"""

    # Build entity comment section
    comment_section = ""
    if entity_comment and entity_comment.strip():
        comment_section = f"""
USER'S ADDITIONAL CONTEXT FOR THIS {entity_type.upper()} (incorporate this):
{entity_comment.strip()}
"""

    prompt = f"""You are a professional resume writer. Write {num_bullets} concise, impactful bullet points for a resume.

TARGET ROLE: {job_analysis.job_title}

{entity_type.upper()} TO DESCRIBE:
{entity_context}

USER-PROVIDED DETAILS:
{answers_context if answers_context else "None provided"}
{comment_section}
RELEVANT SKILLS/TECHNOLOGIES FOR THIS ROLE: {', '.join(job_analysis.required_skills[:8])}
JOB KEYWORDS (include as many as naturally fit — these are critical for ATS): {', '.join(job_analysis.keywords[:15])}
{skill_kw_section}
{bullet_guidance}
{themes_guidance}
{avoid_guidance}

GUIDELINES:
- Weave in confirmed skills and JOB KEYWORDS above whenever they apply to the actual work
- Start each bullet with a strong, varied action verb (e.g. Built, Designed, Reduced, Improved, Automated, Collaborated)
- If the user provided metrics, use their exact numbers; otherwise describe scope/impact without inventing figures
- Each bullet should be 1-2 lines, specific, and achievement-oriented
- Sound like a human wrote it — avoid buzzword overload

STRICT RULES:
- Only reference work that is explicitly in the entity data above — no invented responsibilities
- Do not add outcomes or achievements the user did not mention
- Do not repeat the same action verb across bullets
- Technologies from CONFIRMED SKILLS and JOB KEYWORDS may be mentioned as the tools used, as long as the experience type genuinely involves them

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


def score_content_relevance_ai(
    job_analysis: JobAnalysis,
    experiences: List[Dict[str, Any]],
    projects: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Score all experiences and projects for relevance using a single LLM call.
    Returns semantic relevance_score (0-100), keywords_to_include, and recommendation_reason per item.
    Much more accurate than substring keyword matching.
    """
    client = get_llm_client()
    model = get_model_name()

    exp_lines = []
    for exp in experiences:
        readme_snip = ""
        desc = (exp.get('description') or '')[:300]
        summary = f"ID {exp.get('id')}: {exp.get('position', '')} at {exp.get('company', '')} — {desc}"
        exp_lines.append(summary)

    proj_lines = []
    for proj in projects:
        desc = (proj.get('description') or '')[:200]
        tech = f" Tech: {proj.get('details', '')[:100]}" if proj.get('details') else ""
        readme = f" README: {proj.get('readme_content', '')[:200]}" if proj.get('readme_content') else ""
        summary = f"ID {proj.get('id')}: {proj.get('name', '')} — {desc}{tech}{readme}"
        proj_lines.append(summary)

    prompt = f"""You are a resume relevance expert. Score each experience and project for how relevant it is to the target job.

TARGET JOB: {job_analysis.job_title}
REQUIRED SKILLS: {', '.join(job_analysis.required_skills[:12])}
KEY JD KEYWORDS: {', '.join(job_analysis.keywords[:20])}

EXPERIENCES:
{chr(10).join(exp_lines) if exp_lines else 'None'}

PROJECTS:
{chr(10).join(proj_lines) if proj_lines else 'None'}

Score each item 0-100 using this rubric:
- 80-100: Directly matches required skills/tech — hiring manager will immediately see relevance
- 50-79: Related field or transferable skills — worth including
- 20-49: Shows CS ability or problem-solving, tangentially relevant
- 0-19: Unlikely to impress this hiring manager for this specific role

For keywords_to_include: list JD keywords that could NATURALLY appear in bullets for this item (based on the tech or domain, even if not explicitly stated in the description yet).

Return JSON:
{{
  "experiences": [
    {{"id": <int>, "relevance_score": <0-100>, "keywords_to_include": ["kw1", "kw2"], "recommendation_reason": "1-sentence explanation"}}
  ],
  "projects": [
    {{"id": <int>, "relevance_score": <0-100>, "keywords_to_include": ["kw1"], "recommendation_reason": "1-sentence explanation"}}
  ]
}}"""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON, no other text."}])

    result = parse_json_response(response.choices[0].message.content)

    # Build lookup dicts keyed by item id
    exp_scores = {item["id"]: item for item in result.get("experiences", []) if isinstance(item, dict) and "id" in item}
    proj_scores = {item["id"]: item for item in result.get("projects", []) if isinstance(item, dict) and "id" in item}

    return {"experiences": exp_scores, "projects": proj_scores}


def trim_resume_to_one_page(yaml_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ask the LLM to trim bullet lists so the resume fits on one page.
    Returns updated yaml_data with trimmed generated_bullets per experience/project.
    """
    client = get_llm_client()
    model = get_model_name()

    lines = []
    for i, exp in enumerate(yaml_data.get("experience", [])):
        bullets = exp.get("generated_bullets", [])
        label = f"EXPERIENCE {i} — {exp.get('position', '')} at {exp.get('company', '')}:"
        lines.append(label)
        for b in bullets:
            lines.append(f'- "{b}"')
        lines.append("")

    for i, proj in enumerate(yaml_data.get("projects", [])):
        bullets = proj.get("generated_bullets", [])
        label = f"PROJECT {i} — {proj.get('name', '')}:"
        lines.append(label)
        for b in bullets:
            lines.append(f'- "{b}"')
        lines.append("")

    content_block = "\n".join(lines)

    prompt = f"""The following resume content is generating more than 1 page. Trim the bullets so it fits on one page.

{content_block}

Trimming rules:
- Max 2 bullets per experience (keep the most keyword-rich, achievement-oriented ones)
- Max 2 bullets per project (prefer dropping a whole project over trimming to 1 bullet)
- Shorten any bullet longer than 100 characters to one tight line — preserve the key achievement
- If still too long, drop the least-relevant project entirely
- Never drop experiences, just trim their bullets
- Preserve quantified achievements and keywords over vague statements

Return JSON with 0-based indices matching the input order:
{{
  "experiences": {{"0": ["bullet1", "bullet2"], "1": ["bullet1"]}},
  "projects": {{"0": ["bullet1", "bullet2"], "1": ["bullet1"]}}
}}
Only include items that have bullets (omit empty ones)."""

    try:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}], response_format={"type": "json_object"})
    except Exception:
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt + "\n\nRespond with ONLY valid JSON, no other text."}])

    result = parse_json_response(response.choices[0].message.content)

    import copy
    trimmed_data = copy.deepcopy(yaml_data)

    exp_map = result.get("experiences", {})
    for i, exp in enumerate(trimmed_data.get("experience", [])):
        key = str(i)
        if key in exp_map and isinstance(exp_map[key], list):
            exp["generated_bullets"] = exp_map[key]

    proj_map = result.get("projects", {})
    trimmed_projects = []
    for i, proj in enumerate(trimmed_data.get("projects", [])):
        key = str(i)
        if key in proj_map and isinstance(proj_map[key], list) and proj_map[key]:
            proj["generated_bullets"] = proj_map[key]
            trimmed_projects.append(proj)
        elif key not in proj_map:
            pass  # project was dropped by LLM
        else:
            trimmed_projects.append(proj)  # keep as-is if something unexpected
    trimmed_data["projects"] = trimmed_projects

    return trimmed_data


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
        bullets_per_exp = [3, 2, 2]  # Tighter for 1-page
        bullets_per_proj = [2, 2]
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
