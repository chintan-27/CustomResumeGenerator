from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env", override=True)

from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import os
import json
import hashlib
import secrets
import time

# Absolute path to api/output/ — all resume files stored here
API_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(API_DIR, "output")
from datetime import datetime, timedelta
from dataclasses import asdict
from resumeMaker import make_latex_resume, make_latex_resume_v2, read_latex, write_latex, compile_pdf
from gpt_v2 import (
    analyze_job_description,
    generate_prompt_instructions,
    generate_clarifying_questions,
    generate_grounded_bullets,
    generate_skills_section,
    select_content_for_page_count,
    score_content_relevance_ai,
    fetch_github_readme,
    get_llm_client,
    get_model_name,
    llm_call_with_retry,
    JobAnalysis,
    PromptInstructions
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"  # Change to PostgreSQL/MySQL in production
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "afeuhwoi2839or2224902h4r880820804#(@*$#)&093U"  # Change this in production
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    onboarding_completed = db.Column(db.Boolean, default=False)
    email_verified = db.Column(db.Boolean, default=False)
    reset_token_hash = db.Column(db.String(255))
    reset_token_expires = db.Column(db.DateTime)
    verify_token_hash = db.Column(db.String(255))

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    linkedin = db.Column(db.String(255))
    github = db.Column(db.String(255))
    website = db.Column(db.String(255))
    phone = db.Column(db.String(255))

class Education(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    university = db.Column(db.String(255), nullable=False)
    gpa = db.Column(db.String(10))
    max_gpa = db.Column(db.String(10))
    start_date = db.Column(db.String(50))
    end_date = db.Column(db.String(50))
    degree = db.Column(db.String(255))
    major = db.Column(db.String(255))
    specialization = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    country = db.Column(db.String(100))
    relevant_coursework = db.Column(db.String(1024)) 

class Experience(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    position = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    start_date = db.Column(db.String(50))
    end_date = db.Column(db.String(50))
    current = db.Column(db.Boolean, default=False)
    description = db.Column(db.Text)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    link = db.Column(db.String(255))
    details = db.Column(db.Text)

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    skills = db.Column(db.String(1024))

class Certification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    issuer = db.Column(db.String(255), nullable=False)
    date_issued = db.Column(db.String(50))   # "Month Year"
    expiry_date = db.Column(db.String(50))   # "Month Year" or "No Expiry"
    credential_id = db.Column(db.String(255))
    link = db.Column(db.String(512))

class Publication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(512), nullable=False)
    authors = db.Column(db.String(512), nullable=False)   # comma-separated
    venue = db.Column(db.String(255), nullable=False)     # journal or conference
    year = db.Column(db.String(10))
    doi = db.Column(db.String(255))
    link = db.Column(db.String(512))
    abstract = db.Column(db.Text)

# Job Tracker Model
class JobApplication(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    company = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='wishlist')  # wishlist, applied, interview, offer
    url = db.Column(db.String(512))
    notes = db.Column(db.Text)
    salary = db.Column(db.String(100))
    location = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

# Resume Generation Session Models
class GenerationSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    job_description = db.Column(db.Text, nullable=False)
    extracted_keywords = db.Column(db.JSON)  # Store as JSON
    job_title = db.Column(db.String(255))
    required_skills_json = db.Column(db.JSON)  # required_skills from job analysis
    job_field = db.Column(db.String(50))  # software, ai, data, etc.
    years_required = db.Column(db.Integer)
    session_state = db.Column(db.String(50), default='analyzing')  # analyzing, questions, generating, review, template, complete
    template_id = db.Column(db.String(50), default='jake')
    page_count = db.Column(db.Integer, default=1)
    skills_organized = db.Column(db.Text)  # JSON string of organized skills from V2 pipeline
    prompt_instructions = db.Column(db.Text)  # JSON string of role-specific prompt guidance
    selected_experience_ids = db.Column(db.JSON)  # [1, 3, 5]
    selected_project_ids    = db.Column(db.JSON)  # [2, 4]
    entity_comments         = db.Column(db.JSON)  # {"exp_1": "...", "proj_2": "..."}
    entity_keyword_hints    = db.Column(db.JSON)  # {"exp_3": ["Python","REST APIs"], "proj_10": []}
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())

class ClarifyingQuestion(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('generation_session.id'), nullable=False)
    question_type = db.Column(db.String(50), nullable=False)  # metrics, verification, gap_filling
    target_entity = db.Column(db.String(50))  # experience, project, skill
    target_id = db.Column(db.Integer)  # ID of the experience/project
    target_name = db.Column(db.String(255))  # Display name for the target
    question_text = db.Column(db.Text, nullable=False)
    input_type = db.Column(db.String(50), default='radio')  # radio, multiselect (option-based for better UX)
    options = db.Column(db.JSON)  # For radio/multiselect options
    context = db.Column(db.Text)  # Hint explaining why the question helps
    user_answer = db.Column(db.Text)
    answered = db.Column(db.Boolean, default=False)

class GeneratedContent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('generation_session.id'), nullable=False)
    content_type = db.Column(db.String(50), nullable=False)  # experience_bullet, project_bullet, skill_section
    target_id = db.Column(db.Integer)  # ID of experience/project
    original_text = db.Column(db.Text)  # User's original description
    generated_text = db.Column(db.Text)  # AI-generated bullet point
    keywords_used = db.Column(db.JSON)  # Keywords incorporated
    user_approved = db.Column(db.Boolean, default=False)
    user_edited_text = db.Column(db.Text)  # If user modified the text

class UserMetrics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)  # experience, project
    entity_id = db.Column(db.Integer, nullable=False)
    metric_type = db.Column(db.String(100))  # team_size, improvement_percentage, users_impacted
    metric_value = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# Create the database
with app.app_context():
    db.create_all()
    # Add new columns that may be missing from existing databases (SQLite ALTER TABLE migration)
    _migrations = [
        "ALTER TABLE generation_session ADD COLUMN selected_experience_ids JSON",
        "ALTER TABLE generation_session ADD COLUMN selected_project_ids JSON",
        "ALTER TABLE generation_session ADD COLUMN entity_comments JSON",
        "ALTER TABLE generation_session ADD COLUMN entity_keyword_hints JSON",
        "ALTER TABLE generation_session ADD COLUMN job_title VARCHAR(255)",
        "ALTER TABLE generation_session ADD COLUMN required_skills_json JSON",
    ]
    with db.engine.connect() as _conn:
        _existing = {row[1] for row in _conn.execute(db.text("PRAGMA table_info(generation_session)")).fetchall()}
        for _stmt in _migrations:
            _col = _stmt.split("ADD COLUMN ")[1].split()[0]
            if _col not in _existing:
                _conn.execute(db.text(_stmt))
        _conn.commit()

# Signup Route
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already exists"}), 409

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    new_user = User(name=name, email=email, password=hashed_password, onboarding_completed = False)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User created successfully"}), 201

# Login Route
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity={"id": user.id, "email": user.email})
    return jsonify({"access_token": access_token, "user": {"id": user.id, "email": user.email, "name": user.name}})

# Set Onboarding Status Complete
@app.route("/api/user/complete", methods=["GET"])
@jwt_required()
def complete_onboarding():
    current_user = get_jwt_identity()
    user = User.query.filter_by(id=current_user["id"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Update onboarding_completed field to true
    user.onboarding_completed = True
    db.session.commit()

    return jsonify({"message": "Onboarding completed"})

# Check Onboarding Status
@app.route("/api/user/status", methods=["GET"])
@jwt_required()
def check_onboarding_status():
    current_user = get_jwt_identity()
    user = User.query.filter_by(id=current_user["id"]).first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "onboarding_completed": user.onboarding_completed,
        "email_verified": user.email_verified,
    })

# PATCH ROUTES
@app.route("/api/user/profile", methods=["POST", "PATCH"])
@jwt_required()
def upsert_profile():
    current_user = get_jwt_identity()
    data = request.json
    profile = Profile.query.filter_by(user_id=current_user["id"]).first()

    if request.method == "POST" and not profile:
        profile = Profile(user_id=current_user["id"])
        db.session.add(profile)

    if profile:
        for key in ["city", "state", "linkedin", "github", "phone", "website"]:
            if key in data:
                setattr(profile, key, data[key])
        db.session.commit()
        return jsonify({"message": "Profile saved successfully"})
    return jsonify({"error": "Profile not found"}), 404

@app.route("/api/user/education", methods=["POST", "PATCH"])
@jwt_required()
def upsert_education():
    current_user = get_jwt_identity()
    data = request.json
    edu = Education.query.filter_by(user_id=current_user["id"], university=data.get("university")).first()

    if request.method == "POST" and not edu:
        edu = Education(user_id=current_user["id"])
        db.session.add(edu)

    if edu:
        for key in data:
            setattr(edu, key, data[key])
        db.session.commit()
        return jsonify({"message": "Education saved successfully"})
    return jsonify({"error": "Education not found"}), 404

@app.route("/api/user/experience", methods=["POST", "PATCH"])
@jwt_required()
def upsert_experience():
    current_user = get_jwt_identity()
    data = request.json
    exp = Experience.query.filter_by(user_id=current_user["id"], position=data.get("position")).first()

    if request.method == "POST" and not exp:
        exp = Experience(user_id=current_user["id"])
        db.session.add(exp)

    if exp:
        for key in data:
            setattr(exp, key, data[key])
        db.session.commit()
        return jsonify({"message": "Experience saved successfully"})
    return jsonify({"error": "Experience not found"}), 404

@app.route("/api/user/project", methods=["POST", "PATCH"])
@jwt_required()
def upsert_project():
    current_user = get_jwt_identity()
    data = request.json
    proj = Project.query.filter_by(user_id=current_user["id"], name=data.get("name")).first()

    if request.method == "POST" and not proj:
        proj = Project(user_id=current_user["id"])
        db.session.add(proj)

    if proj:
        for key in data:
            setattr(proj, key, data[key])
        db.session.commit()
        return jsonify({"message": "Project saved successfully"})
    return jsonify({"error": "Project not found"}), 404

@app.route("/api/user/skills", methods=["POST", "PATCH"])
@jwt_required()
def upsert_skills():
    current_user = get_jwt_identity()
    data = request.json
    skills = Skill.query.filter_by(user_id=current_user["id"]).first()

    if request.method == "POST" and not skills:
        skills = Skill(user_id=current_user["id"])
        db.session.add(skills)

    if skills:
        skills.skills = data.get("skills")
        db.session.commit()
        return jsonify({"message": "Skills saved successfully"})
    return jsonify({"error": "Skills not found"}), 404


# Google Authentication Route
@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.json
    name = data.get("name")
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        user = User(name=name, email=email, password="", onboarding_completed = False)
        db.session.add(user)
        db.session.commit()

    access_token = create_access_token(identity={"id": user.id, "email": user.email})
    return jsonify({"access_token": access_token, "user": {"id": user.id, "email": user.email, "name": user.name}}), 200

# Protected Route
@app.route("/api/auth/protected", methods=["GET"])
@jwt_required()
def protected():
    current_user = get_jwt_identity()
    return jsonify({"message": "Protected route", "user": current_user})

@app.route("/api/user/dashboard", methods=["GET"])
@jwt_required()
def get_dashboard_data():
    current_user = get_jwt_identity()
    user = User.query.filter_by(id=current_user["id"]).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    # Fetch related data
    profile = Profile.query.filter_by(user_id=user.id).first()  # Changed to first() to avoid IndexError
    education = Education.query.filter_by(user_id=user.id).all()
    experience = Experience.query.filter_by(user_id=user.id).all()
    projects = Project.query.filter_by(user_id=user.id).all()
    skills = Skill.query.filter_by(user_id=user.id).first()  # Fetch skills

    certifications = Certification.query.filter_by(user_id=user.id).all()
    publications = Publication.query.filter_by(user_id=user.id).all()

    return jsonify({
        "user": {
            "name": user.name,
            "email": user.email,
            "city": profile.city if profile else None,
            "state": profile.state if profile else None,
            "linkedin": profile.linkedin if profile else None,
            "github": profile.github if profile else None,
            "number": profile.phone if profile else None,
            "website": profile.website if profile else None,
        },
        "education": [{
            "university": edu.university,
            "degree": edu.degree,
            "major": edu.major,
            "gpa": edu.gpa,
            "max_gpa": edu.max_gpa,
            "start_date": edu.start_date,
            "end_date": edu.end_date,
            "city": edu.city,
            "state": edu.state,
            "country": edu.country,
            "relevant_coursework": edu.relevant_coursework
        } for edu in education],
        "experience": [{
            "position": exp.position,
            "company": exp.company,
            "description": exp.description,
            "start_date": exp.start_date,
            "end_date": exp.end_date,
            "current": exp.current
        } for exp in experience],
        "projects": [{
            "name": proj.name,
            "description": proj.description,
            "link": proj.link,
            "details": proj.details
        } for proj in projects],
        "skills": skills.skills if skills else [],
        "certifications": [{
            "id": c.id,
            "name": c.name,
            "issuer": c.issuer,
            "date_issued": c.date_issued,
            "expiry_date": c.expiry_date,
            "credential_id": c.credential_id,
            "link": c.link
        } for c in certifications],
        "publications": [{
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "venue": p.venue,
            "year": p.year,
            "doi": p.doi,
            "link": p.link,
            "abstract": p.abstract
        } for p in publications],
    })

# ============================================================================
# BULLET REWRITE
# ============================================================================

@app.route("/api/resume/rewrite-bullet", methods=["POST"])
@jwt_required()
def rewrite_bullet():
    """
    Rewrite a single bullet point based on a user instruction.
    Returns 3 distinct alternatives.
    Used in the content review step for per-bullet AI editing.
    """
    d = request.json
    bullet_text = d.get("bullet_text", "")
    instruction = d.get("instruction", "")
    entity_type = d.get("entity_type", "experience")  # "experience" or "project"
    entity_name = d.get("entity_name", "")
    entity_description = d.get("entity_description", "")
    job_title = d.get("job_title", "")
    job_keywords = d.get("job_keywords", [])  # list of keywords from job description

    if not bullet_text or not instruction:
        return jsonify({"error": "bullet_text and instruction are required"}), 400

    keywords_str = ", ".join(job_keywords[:10]) if job_keywords else "none provided"

    prompt = f"""You are editing a resume bullet point based on a specific instruction.

Job Target: {job_title}
{entity_type.capitalize()}: {entity_name}
Context: {entity_description[:300]}
Job keywords to incorporate where natural: {keywords_str}

Original bullet:
{bullet_text}

Instruction: {instruction}

Write 3 distinct rewrites of the bullet following the instruction. Each should:
- Start with a strong action verb
- Be one sentence, specific and achievement-oriented
- Be grounded in the original content (don't invent new facts)
- Naturally incorporate relevant job keywords where appropriate
- Vary in phrasing, structure, or emphasis from each other

Return ONLY a numbered list with exactly 3 items, no extra commentary:
1. [first rewrite]
2. [second rewrite]
3. [third rewrite]"""

    try:
        client = get_llm_client()
        model = get_model_name()
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}])
        raw = response.choices[0].message.content.strip()

        # Parse numbered list — strip "1. ", "2. ", "3. " prefixes
        import re as _re
        lines = [l.strip() for l in raw.splitlines() if l.strip()]
        alternatives = []
        for line in lines:
            # Match "1. text", "1) text", or just plain lines
            cleaned = _re.sub(r"^\d+[\.\)]\s*", "", line).strip().strip('"').strip("'")
            if cleaned:
                alternatives.append(cleaned)

        # Ensure exactly 3 (pad with the first if LLM returned fewer)
        while len(alternatives) < 3:
            alternatives.append(alternatives[0] if alternatives else bullet_text)
        alternatives = alternatives[:3]

        return jsonify({"alternatives": alternatives})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================================
# GITHUB REPO SUMMARIZER
# ============================================================================

@app.route("/api/github/summarize-repo", methods=["POST"])
@jwt_required()
def summarize_github_repo():
    """
    Fetch README + file tree from GitHub (using GITHUB_TOKEN if set) then
    call LLM to produce a resume-quality project description.
    Frontend only sends lightweight metadata — no GitHub rate limit on client.
    """
    import requests as _requests
    import base64 as _base64

    d = request.json
    owner = d.get("owner", "")
    repo_name = d.get("repo_name", "")
    repo_description = d.get("repo_description", "")
    default_branch = d.get("default_branch", "main")

    # Build GitHub request headers — token gives 5000 req/hr vs 60 unauthenticated
    gh_headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "resume-generator"}
    github_token = os.getenv("GITHUB_TOKEN", "")
    if github_token:
        gh_headers["Authorization"] = f"token {github_token}"

    readme = ""
    file_tree = []

    if owner and repo_name:
        # Fetch README
        try:
            resp = _requests.get(
                f"https://api.github.com/repos/{owner}/{repo_name}/readme",
                headers=gh_headers, timeout=8,
            )
            if resp.status_code == 200:
                raw = resp.json().get("content", "").replace("\n", "")
                readme = _base64.b64decode(raw).decode("utf-8", errors="ignore")[:4000]
                print(f"[github] README fetched for {owner}/{repo_name} ({len(readme)} chars)")
            else:
                print(f"[github] README fetch failed for {owner}/{repo_name}: HTTP {resp.status_code}")
        except Exception as e:
            print(f"[github] README fetch failed for {owner}/{repo_name}: {e}")

        # Fetch file tree
        try:
            resp = _requests.get(
                f"https://api.github.com/repos/{owner}/{repo_name}/git/trees/{default_branch}?recursive=1",
                headers=gh_headers, timeout=8,
            )
            if resp.status_code == 200:
                file_tree = [
                    f["path"] for f in resp.json().get("tree", [])
                    if f.get("type") in ("blob", "tree")
                ][:80]
                print(f"[github] Tree fetched for {owner}/{repo_name} ({len(file_tree)} paths)")
            else:
                print(f"[github] Tree fetch failed for {owner}/{repo_name}: HTTP {resp.status_code}")
        except Exception as e:
            print(f"[github] Tree fetch failed for {owner}/{repo_name}: {e}")

    # Build LLM context — always call LLM even with minimal info (repo name alone is useful)
    parts = []
    if repo_description:
        parts.append(f"GitHub description: {repo_description}")
    if readme:
        parts.append(f"README:\n{readme}")
    if file_tree:
        parts.append(f"File structure:\n" + "\n".join(file_tree))

    print(f"[github] Context for {repo_name}: description={bool(repo_description)}, readme={bool(readme)}, tree={len(file_tree)} files")

    context_section = "\n\n".join(parts) if parts else "(No README or description available — infer from project name and file structure)"

    prompt = f"""You are writing a project description for a developer's resume.

Project name: {repo_name}

{context_section}

Write a concise 2-3 sentence description of what this project does, suitable for a resume bullet or summary.

Guidelines:
- Explain what the project accomplishes and why it's useful
- Mention the core technologies actually used (from README or file structure if available)
- Be specific — avoid vague phrases like "a web app" or "a tool"
- If context is thin, make reasonable inferences from the project name and any file paths
- Return ONLY the description text, no labels or preamble
"""

    try:
        client = get_llm_client()
        model = get_model_name()
        response = llm_call_with_retry(client, model, [{"role": "user", "content": prompt}])
        description = response.choices[0].message.content.strip()
        return jsonify({"description": description})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# CERTIFICATIONS ENDPOINTS
# ============================================================================

@app.route("/api/certifications", methods=["GET"])
@jwt_required()
def get_certifications():
    uid = get_jwt_identity()["id"]
    certs = Certification.query.filter_by(user_id=uid).all()
    return jsonify([{
        "id": c.id, "name": c.name, "issuer": c.issuer,
        "date_issued": c.date_issued, "expiry_date": c.expiry_date,
        "credential_id": c.credential_id, "link": c.link
    } for c in certs])

@app.route("/api/certifications", methods=["POST"])
@jwt_required()
def add_certification():
    uid = get_jwt_identity()["id"]
    d = request.json
    cert = Certification(
        user_id=uid,
        name=d.get("name", ""),
        issuer=d.get("issuer", ""),
        date_issued=d.get("date_issued"),
        expiry_date=d.get("expiry_date"),
        credential_id=d.get("credential_id"),
        link=d.get("link")
    )
    db.session.add(cert)
    db.session.commit()
    return jsonify({"message": "Certification added", "id": cert.id}), 201

@app.route("/api/certifications/<int:cert_id>", methods=["DELETE"])
@jwt_required()
def delete_certification(cert_id):
    uid = get_jwt_identity()["id"]
    cert = Certification.query.filter_by(id=cert_id, user_id=uid).first()
    if not cert:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(cert)
    db.session.commit()
    return jsonify({"message": "Deleted"})

# ============================================================================
# PUBLICATIONS ENDPOINTS
# ============================================================================

@app.route("/api/publications", methods=["GET"])
@jwt_required()
def get_publications():
    uid = get_jwt_identity()["id"]
    pubs = Publication.query.filter_by(user_id=uid).all()
    return jsonify([{
        "id": p.id, "title": p.title, "authors": p.authors,
        "venue": p.venue, "year": p.year, "doi": p.doi,
        "link": p.link, "abstract": p.abstract
    } for p in pubs])

@app.route("/api/publications", methods=["POST"])
@jwt_required()
def add_publication():
    uid = get_jwt_identity()["id"]
    d = request.json
    pub = Publication(
        user_id=uid,
        title=d.get("title", ""),
        authors=d.get("authors", ""),
        venue=d.get("venue", ""),
        year=d.get("year"),
        doi=d.get("doi"),
        link=d.get("link"),
        abstract=d.get("abstract")
    )
    db.session.add(pub)
    db.session.commit()
    return jsonify({"message": "Publication added", "id": pub.id}), 201

@app.route("/api/publications/<int:pub_id>", methods=["DELETE"])
@jwt_required()
def delete_publication(pub_id):
    uid = get_jwt_identity()["id"]
    pub = Publication.query.filter_by(id=pub_id, user_id=uid).first()
    if not pub:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(pub)
    db.session.commit()
    return jsonify({"message": "Deleted"})

# ============================================================================
# NEW AGENTIC RESUME GENERATION ENDPOINTS (V2)
# ============================================================================

# Template configurations
TEMPLATES = {
    "jake": {
        "id": "jake",
        "name": "Jake's Resume",
        "description": "The most popular Overleaf template — clean, timeless",
        "ats_compliant": True,
        "section_order": ["education", "experience", "projects", "skills"],
        "supports_two_page": True,
    },
    "modern": {
        "id": "modern",
        "name": "Modern Blue",
        "description": "Clean lines with blue accent rule, two-col header",
        "ats_compliant": True,
        "section_order": ["education", "experience", "projects", "skills"],
        "supports_two_page": True,
    },
    "minimal": {
        "id": "minimal",
        "name": "Minimal",
        "description": "Garamond-inspired, maximum whitespace, em-dash bullets",
        "ats_compliant": True,
        "section_order": ["education", "experience", "projects", "skills"],
        "supports_two_page": True,
    },
    "skills-first": {
        "id": "skills-first",
        "name": "Skills First",
        "description": "ATS-optimized with skills at the top — 2026 trend",
        "ats_compliant": True,
        "section_order": ["skills", "experience", "projects", "education"],
        "supports_two_page": True,
    },
    "executive": {
        "id": "executive",
        "name": "Executive",
        "description": "Bold header, small caps sections — for senior roles",
        "ats_compliant": True,
        "section_order": ["experience", "education", "skills", "projects"],
        "supports_two_page": True,
    },
    "ats-clean": {
        "id": "ats-clean",
        "name": "ATS Clean",
        "description": "Zero color, ALL CAPS sections — maximum machine readability",
        "ats_compliant": True,
        "section_order": ["education", "experience", "projects", "skills"],
        "supports_two_page": True,
    },
}

@app.route("/api/templates", methods=["GET"])
@jwt_required()
def get_templates():
    """Get list of available resume templates."""
    return jsonify({"templates": list(TEMPLATES.values())})

@app.route("/api/resume/start-session", methods=["POST"])
@jwt_required()
def start_generation_session():
    """
    Start a new resume generation session.
    Analyzes the job description and generates clarifying questions.
    """
    current_user = get_jwt_identity()
    data = request.json
    job_description = data.get("job_description")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400

    try:
        # Analyze job description
        job_analysis = analyze_job_description(job_description)

        # Generate role-specific prompt instructions (one fast call)
        prompt_instructions = generate_prompt_instructions(job_analysis)

        # Create session
        session = GenerationSession(
            user_id=current_user["id"],
            job_description=job_description,
            extracted_keywords=job_analysis.keywords,
            job_title=job_analysis.job_title,
            required_skills_json=job_analysis.required_skills,
            job_field=job_analysis.job_field,
            years_required=job_analysis.years_required,
            session_state="questions",
            prompt_instructions=json.dumps(asdict(prompt_instructions))
        )
        db.session.add(session)
        db.session.commit()

        # Fetch user's experiences and projects
        experiences = Experience.query.filter_by(user_id=current_user["id"]).all()
        projects = Project.query.filter_by(user_id=current_user["id"]).all()
        skills = Skill.query.filter_by(user_id=current_user["id"]).first()

        experiences_data = [{
            "id": exp.id,
            "position": exp.position,
            "company": exp.company,
            "description": exp.description,
            "start_date": exp.start_date,
            "end_date": exp.end_date,
            "current": exp.current
        } for exp in experiences]

        # Fetch GitHub READMEs for projects
        projects_data = []
        for proj in projects:
            readme = None
            if proj.link and "github.com" in proj.link:
                readme = fetch_github_readme(proj.link)
            projects_data.append({
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "details": proj.details,  # this is the tech stack field in the DB
                "link": proj.link,
                "readme_content": readme
            })

        # AI-based relevance scoring — semantic, not substring matching
        ai_scores = score_content_relevance_ai(job_analysis, experiences_data, projects_data)
        ai_exp_scores = ai_scores.get("experiences", {})
        ai_proj_scores = ai_scores.get("projects", {})

        # Build entity_keyword_hints for later use in generate-draft
        entity_keyword_hints = {}

        scored_experiences = []
        for exp in experiences_data:
            scored_item = ai_exp_scores.get(exp.get('id'), {})
            score = scored_item.get("relevance_score", 20)
            reason = scored_item.get("recommendation_reason", "General experience")
            kw_hints = scored_item.get("keywords_to_include", [])
            entity_keyword_hints[f"exp_{exp.get('id')}"] = kw_hints
            scored_experiences.append({
                **exp,
                "relevance_score": score,
                "recommendation_reason": reason,
                "suggested_highlight": f"We'll emphasize your {exp.get('position', '')} work to match the job description",
            })

        scored_projects = []
        for proj in projects_data:
            scored_item = ai_proj_scores.get(proj.get('id'), {})
            score = scored_item.get("relevance_score", 20)
            reason = scored_item.get("recommendation_reason", "Relevant project")
            kw_hints = scored_item.get("keywords_to_include", [])
            entity_keyword_hints[f"proj_{proj.get('id')}"] = kw_hints
            scored_projects.append({
                **proj,
                "relevance_score": score,
                "recommendation_reason": reason,
                "suggested_highlight": f"We'll emphasize the {proj.get('name', '')} aspects",
            })

        # Persist keyword hints for use in generate-draft bullet injection
        session.entity_keyword_hints = entity_keyword_hints
        db.session.commit()

        return jsonify({
            "session_id": session.id,
            "job_analysis": asdict(job_analysis),
            "experiences": scored_experiences,
            "projects": scored_projects,
        })

    except Exception as e:
        print(f"Error starting session: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/resume/answer-questions", methods=["POST"])
@jwt_required()
def answer_questions():
    """
    Store user answers to clarifying questions.
    """
    current_user = get_jwt_identity()
    data = request.json
    session_id = data.get("session_id")
    answers = data.get("answers", {})  # {question_id: answer}

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    # Verify session belongs to user
    session = GenerationSession.query.filter_by(
        id=session_id,
        user_id=current_user["id"]
    ).first()

    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        # Update answers
        for question_id, answer in answers.items():
            question = ClarifyingQuestion.query.filter_by(
                id=int(question_id),
                session_id=session_id
            ).first()

            if question:
                question.user_answer = str(answer)
                question.answered = True

                # Also store in UserMetrics if it's a metric question
                if question.question_type == "metrics" and question.target_id:
                    metric = UserMetrics(
                        user_id=current_user["id"],
                        entity_type=question.target_entity,
                        entity_id=question.target_id,
                        metric_type=question.question_text[:100],
                        metric_value=str(answer)
                    )
                    db.session.add(metric)

        session.session_state = "generating"
        db.session.commit()

        return jsonify({
            "success": True,
            "session_id": session_id,
            "session_state": session.session_state
        })

    except Exception as e:
        print(f"Error saving answers: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/resume/select-content", methods=["POST"])
@jwt_required()
def select_content():
    """
    Save user's selected experiences/projects and generate targeted clarifying questions.
    Called after user picks which items to include.
    """
    current_user = get_jwt_identity()
    data = request.json
    session_id = data.get("session_id")
    selected_exp_ids = data.get("selected_experience_ids", [])
    selected_proj_ids = data.get("selected_project_ids", [])
    entity_comments = data.get("comments", {})  # {"exp_1": "...", "proj_2": "..."}

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    session = GenerationSession.query.filter_by(id=session_id, user_id=current_user["id"]).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        # Save selection to session
        session.selected_experience_ids = selected_exp_ids
        session.selected_project_ids = selected_proj_ids
        session.entity_comments = entity_comments
        db.session.commit()

        # Fetch ONLY selected experiences and projects
        experiences = Experience.query.filter(
            Experience.id.in_(selected_exp_ids),
            Experience.user_id == current_user["id"]
        ).all() if selected_exp_ids else []

        projects = Project.query.filter(
            Project.id.in_(selected_proj_ids),
            Project.user_id == current_user["id"]
        ).all() if selected_proj_ids else []

        skills = Skill.query.filter_by(user_id=current_user["id"]).first()

        job_analysis = JobAnalysis(
            job_title=session.job_title or "",
            job_field=session.job_field or "",
            years_required=session.years_required or 0,
            required_skills=session.required_skills_json or session.extracted_keywords or [],
            preferred_skills=[],
            keywords=session.extracted_keywords or [],
            key_responsibilities=[],
            company_values=[]
        )

        # Attach entity comments to experiences/projects
        experiences_data = []
        for exp in experiences:
            comment_key = f"exp_{exp.id}"
            experiences_data.append({
                "id": exp.id,
                "position": exp.position,
                "company": exp.company,
                "description": exp.description,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "current": exp.current,
                "user_comment": entity_comments.get(comment_key, "")
            })

        projects_data = []
        for proj in projects:
            readme = None
            if proj.link and "github.com" in proj.link:
                readme = fetch_github_readme(proj.link)
            comment_key = f"proj_{proj.id}"
            projects_data.append({
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "details": proj.details,
                "link": proj.link,
                "readme_content": readme,
                "user_comment": entity_comments.get(comment_key, "")
            })

        prompt_instructions_data = None
        if session.prompt_instructions:
            pi_dict = json.loads(session.prompt_instructions)
            prompt_instructions_data = PromptInstructions(**pi_dict)

        # Generate questions only for selected items
        questions = generate_clarifying_questions(
            job_analysis,
            experiences_data,
            projects_data,
            skills.skills if skills else "",
            prompt_instructions=prompt_instructions_data
        )

        # Clear old questions for this session, store new ones
        ClarifyingQuestion.query.filter_by(session_id=session.id).delete()
        for q in questions:
            question = ClarifyingQuestion(
                session_id=session.id,
                question_type=q.question_type,
                target_entity=q.target_entity,
                target_id=q.target_id,
                target_name=q.target_name,
                question_text=q.question_text,
                input_type=q.input_type,
                options=q.options,
                context=q.context
            )
            db.session.add(question)
        db.session.commit()

        return jsonify({
            "questions": [{
                "id": q.id,
                "question_type": q.question_type,
                "target_entity": q.target_entity,
                "target_id": q.target_id,
                "target_name": q.target_name,
                "question_text": q.question_text,
                "input_type": q.input_type,
                "options": q.options,
                "context": q.context
            } for q in ClarifyingQuestion.query.filter_by(session_id=session.id).all()],
            "experiences": experiences_data,
            "projects": projects_data,
        })

    except Exception as e:
        print(f"Error in select_content: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/resume/generate-draft", methods=["POST"])
@jwt_required()
def generate_draft():
    """
    Generate resume content based on user data and answers.
    Returns generated bullets for review.
    """
    current_user = get_jwt_identity()
    data = request.json
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    session = GenerationSession.query.filter_by(
        id=session_id,
        user_id=current_user["id"]
    ).first()

    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        # Reconstruct job analysis
        job_analysis = JobAnalysis(
            job_title=session.job_title or "",
            job_field=session.job_field or "other",
            years_required=session.years_required or 0,
            required_skills=session.required_skills_json or session.extracted_keywords or [],
            preferred_skills=[],
            keywords=session.extracted_keywords or [],
            key_responsibilities=[],
            company_values=[]
        )

        # Fetch user data — respect content selection from select-content step
        if session.selected_experience_ids:
            experiences = Experience.query.filter(
                Experience.id.in_(session.selected_experience_ids),
                Experience.user_id == current_user["id"]
            ).all()
        else:
            experiences = Experience.query.filter_by(user_id=current_user["id"]).all()

        if session.selected_project_ids:
            projects = Project.query.filter(
                Project.id.in_(session.selected_project_ids),
                Project.user_id == current_user["id"]
            ).all()
        else:
            projects = Project.query.filter_by(user_id=current_user["id"]).all()

        skills = Skill.query.filter_by(user_id=current_user["id"]).first()

        # Get user answers
        questions = ClarifyingQuestion.query.filter_by(session_id=session_id).all()
        answers = {q.id: q.user_answer for q in questions if q.answered}

        # Load prompt instructions from session
        pi_data = None
        if session.prompt_instructions:
            try:
                pi_dict = json.loads(session.prompt_instructions)
                pi_data = PromptInstructions(**pi_dict)
            except Exception:
                pass

        # Select content based on page count
        page_count = session.page_count or 1

        # Fetch GitHub READMEs for projects (for bullet generation context)
        projects_with_readme = []
        for proj in projects:
            readme = None
            if proj.link and "github.com" in proj.link:
                readme = fetch_github_readme(proj.link)
            projects_with_readme.append({
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "details": proj.details,
                "link": proj.link,
                "readme_content": readme
            })

        selection = select_content_for_page_count(
            [{
                "id": exp.id,
                "position": exp.position,
                "company": exp.company,
                "description": exp.description,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "current": exp.current
            } for exp in experiences],
            projects_with_readme,
            job_analysis,
            page_count
        )

        generated_content = []

        # Compute which JD keywords the user confirmed in their skills profile
        skills_text = (skills.skills or "").lower() if skills else ""
        all_jd_terms = list(dict.fromkeys(job_analysis.keywords + job_analysis.required_skills))
        user_skill_keywords = [kw for kw in all_jd_terms if kw.lower() in skills_text]

        # Entity comments and keyword hints from select-content / start-session steps
        entity_comments = session.entity_comments or {}
        entity_keyword_hints = session.entity_keyword_hints or {}

        # Generate bullets for experiences
        for i, exp_data in enumerate(selection["experiences"]):
            if i > 0:
                time.sleep(0.5)  # avoid rate limiting on sequential calls
            relevant_qs = [{"id": q.id, "question_text": q.question_text}
                         for q in questions
                         if q.target_entity == "experience" and q.target_id == exp_data.get("_original_index")]

            exp_comment = entity_comments.get(f"exp_{exp_data.get('id')}", "")
            exp_hints = entity_keyword_hints.get(f"exp_{exp_data.get('id')}", [])
            exp_merged_keywords = list(dict.fromkeys(user_skill_keywords + exp_hints))

            bullets = generate_grounded_bullets(
                job_analysis,
                "experience",
                exp_data,
                exp_data.get("id"),
                answers,
                relevant_qs,
                exp_data.get("_bullets_count", 3),
                prompt_instructions=pi_data,
                user_skill_keywords=exp_merged_keywords,
                entity_comment=exp_comment,
            )

            for bullet in bullets:
                content = GeneratedContent(
                    session_id=session_id,
                    content_type="experience_bullet",
                    target_id=bullet.target_id,
                    original_text=bullet.original_text,
                    generated_text=bullet.generated_text,
                    keywords_used=bullet.keywords_used
                )
                db.session.add(content)
                db.session.flush()  # get auto-assigned id
                generated_content.append({
                    "id": content.id,
                    "type": "experience",
                    "target_id": bullet.target_id,
                    "target_name": exp_data.get("company", ""),
                    "position": exp_data.get("position", ""),
                    "original_text": bullet.original_text,
                    "generated_text": bullet.generated_text,
                    "keywords_used": bullet.keywords_used,
                    "grounding_source": bullet.grounding_source
                })

        # Generate bullets for projects
        for proj_data in selection["projects"]:
            time.sleep(0.5)  # avoid rate limiting on sequential calls
            relevant_qs = [{"id": q.id, "question_text": q.question_text}
                         for q in questions
                         if q.target_entity == "project" and q.target_id == proj_data.get("_original_index")]

            proj_comment = entity_comments.get(f"proj_{proj_data.get('id')}", "")
            proj_hints = entity_keyword_hints.get(f"proj_{proj_data.get('id')}", [])
            proj_merged_keywords = list(dict.fromkeys(user_skill_keywords + proj_hints))

            bullets = generate_grounded_bullets(
                job_analysis,
                "project",
                proj_data,
                proj_data.get("id"),
                answers,
                relevant_qs,
                proj_data.get("_bullets_count", 2),
                prompt_instructions=pi_data,
                user_skill_keywords=proj_merged_keywords,
                entity_comment=proj_comment,
            )

            for bullet in bullets:
                content = GeneratedContent(
                    session_id=session_id,
                    content_type="project_bullet",
                    target_id=bullet.target_id,
                    original_text=bullet.original_text,
                    generated_text=bullet.generated_text,
                    keywords_used=bullet.keywords_used
                )
                db.session.add(content)
                db.session.flush()  # get auto-assigned id
                generated_content.append({
                    "id": content.id,
                    "type": "project",
                    "target_id": bullet.target_id,
                    "target_name": proj_data.get("name", ""),
                    "original_text": bullet.original_text,
                    "generated_text": bullet.generated_text,
                    "keywords_used": bullet.keywords_used,
                    "grounding_source": bullet.grounding_source
                })

        # Generate skills section
        skills_organized = generate_skills_section(
            job_analysis,
            skills.skills if skills else "",
            session.job_field or "other"
        )

        session.session_state = "review"
        session.skills_organized = json.dumps(skills_organized)
        db.session.commit()

        return jsonify({
            "session_id": session_id,
            "generated_content": generated_content,
            "skills_organized": skills_organized,
            "selected_experiences": [
                {"id": e.get("id"), "position": e.get("position"), "company": e.get("company")}
                for e in selection["experiences"]
            ],
            "selected_projects": [
                {"id": p.get("id"), "name": p.get("name")}
                for p in selection["projects"]
            ],
            "session_state": session.session_state
        })

    except Exception as e:
        print(f"Error generating draft: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/resume/review-content", methods=["POST"])
@jwt_required()
def review_content():
    """
    Store user approvals and edits for generated content.
    """
    current_user = get_jwt_identity()
    data = request.json
    session_id = data.get("session_id")
    content_reviews = data.get("reviews", [])  # [{content_id, approved, edited_text}]

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    session = GenerationSession.query.filter_by(
        id=session_id,
        user_id=current_user["id"]
    ).first()

    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        for review in content_reviews:
            content = GeneratedContent.query.filter_by(
                id=review.get("content_id"),
                session_id=session_id
            ).first()

            if content:
                content.user_approved = review.get("approved", False)
                if review.get("edited_text"):
                    content.user_edited_text = review["edited_text"]

        session.session_state = "template"
        db.session.commit()

        return jsonify({
            "success": True,
            "session_id": session_id,
            "session_state": session.session_state
        })

    except Exception as e:
        print(f"Error reviewing content: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/resume/select-options", methods=["POST"])
@jwt_required()
def select_options():
    """
    Set template and page count preferences.
    """
    current_user = get_jwt_identity()
    data = request.json
    session_id = data.get("session_id")
    template_id = data.get("template_id", "jake")
    page_count = data.get("page_count", 1)

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    session = GenerationSession.query.filter_by(
        id=session_id,
        user_id=current_user["id"]
    ).first()

    if not session:
        return jsonify({"error": "Session not found"}), 404

    if template_id not in TEMPLATES:
        return jsonify({"error": "Invalid template ID"}), 400

    if page_count not in [1, 2]:
        return jsonify({"error": "Page count must be 1 or 2"}), 400

    try:
        session.template_id = template_id
        session.page_count = page_count
        session.session_state = "complete"
        db.session.commit()

        return jsonify({
            "success": True,
            "session_id": session_id,
            "template": TEMPLATES[template_id],
            "page_count": page_count,
            "session_state": session.session_state
        })

    except Exception as e:
        print(f"Error selecting options: {e}")
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/api/resume/finalize", methods=["POST"])
@jwt_required()
def finalize_resume():
    """
    Generate final PDF with selected template and approved content.
    """
    current_user = get_jwt_identity()
    data = request.json
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"error": "Session ID is required"}), 400

    session = GenerationSession.query.filter_by(
        id=session_id,
        user_id=current_user["id"]
    ).first()

    if not session:
        return jsonify({"error": "Session not found"}), 404

    try:
        # Get user data
        user = User.query.filter_by(id=current_user["id"]).first()
        profile = Profile.query.filter_by(user_id=user.id).first()
        education = Education.query.filter_by(user_id=user.id).all()
        experiences = Experience.query.filter_by(user_id=user.id).all()
        projects = Project.query.filter_by(user_id=user.id).all()
        skills = Skill.query.filter_by(user_id=user.id).first()
        certifications = Certification.query.filter_by(user_id=user.id).all()
        publications = Publication.query.filter_by(user_id=user.id).all()

        # Get approved content — only user-approved bullets; fall back to all if none reviewed
        approved_content = GeneratedContent.query.filter_by(
            session_id=session_id,
            user_approved=True
        ).all()
        all_content = GeneratedContent.query.filter_by(session_id=session_id).all()
        generated_content = approved_content if approved_content else all_content

        # Group content by target
        experience_bullets = {}
        project_bullets = {}

        for content in generated_content:
            text = content.user_edited_text if content.user_edited_text else content.generated_text
            if content.content_type == "experience_bullet":
                if content.target_id not in experience_bullets:
                    experience_bullets[content.target_id] = []
                experience_bullets[content.target_id].append(text)
            elif content.content_type == "project_bullet":
                if content.target_id not in project_bullets:
                    project_bullets[content.target_id] = []
                project_bullets[content.target_id].append(text)

        # Determine template directory
        template_id = session.template_id or "jake"
        template_dir = os.path.join(API_DIR, "templates", template_id)
        if not os.path.exists(template_dir):
            template_dir = os.path.join(API_DIR, "templates", "jake")

        main_tex_file = os.path.join(template_dir, "main.tex")
        session_output_dir = os.path.join(OUTPUT_DIR, "sessions", str(session_id))
        os.makedirs(session_output_dir, exist_ok=True)
        output_tex_file = os.path.join(session_output_dir, "resume.tex")

        # Build relevant coursework string
        relevant_coursework = ""
        for edu in education:
            if edu.relevant_coursework:
                relevant_coursework += edu.relevant_coursework

        # Build YAML data for template
        yaml_data = {
            "name": user.name,
            "city": profile.city if profile else "",
            "state": profile.state if profile else "",
            "email": user.email,
            "number": profile.phone if profile else "",
            "linkedin": profile.linkedin if profile else "",
            "github": profile.github if profile else "",
            "website": profile.website if profile else "",
            "education": [
                {
                    "university": edu.university,
                    "gpa": edu.gpa,
                    "maxgpa": edu.max_gpa,
                    "startmonth": edu.start_date.split(" ")[0] if edu.start_date else "",
                    "startyear": edu.start_date.split(" ")[-1] if edu.start_date else "",
                    "endmonth": edu.end_date.split(" ")[0] if edu.end_date else "",
                    "endyear": edu.end_date.split(" ")[-1] if edu.end_date else "",
                    "degree": edu.degree,
                    "major": edu.major,
                    "specialization": edu.specialization or "",
                    "educity": edu.city,
                    "edustate": edu.state,
                    "educountry": edu.country
                } for edu in education
            ],
            "relevantcoursework": relevant_coursework,
            "skills": skills.skills if skills else "",
            "skills_organized": json.loads(session.skills_organized) if session.skills_organized else {},
            "experience": [
                {
                    "position": exp.position,
                    "company": exp.company,
                    "startmonth": exp.start_date.split(" ")[0] if exp.start_date else "",
                    "startyear": exp.start_date.split(" ")[-1] if exp.start_date else "",
                    "endmonth": "" if exp.current else (exp.end_date.split(" ")[0] if exp.end_date else ""),
                    "endyear": "" if exp.current else (exp.end_date.split(" ")[-1] if exp.end_date else ""),
                    "current": exp.current,
                    "description": exp.description,
                    "generated_bullets": experience_bullets.get(exp.id, [])
                } for exp in experiences
                if experience_bullets.get(exp.id)  # only include experiences that have generated bullets
            ],
            "projects": [
                {
                    "name": proj.name,
                    "details": proj.details,
                    "link": proj.link,
                    "description": proj.description,
                    "generated_bullets": project_bullets.get(proj.id, [])
                } for proj in projects
                if project_bullets.get(proj.id)  # only include projects that have generated bullets
            ],
            "certifications": [
                {
                    "name": c.name,
                    "issuer": c.issuer,
                    "date_issued": c.date_issued or "",
                    "expiry_date": c.expiry_date or "",
                    "credential_id": c.credential_id or "",
                    "link": c.link or ""
                } for c in certifications
            ],
            "publications": [
                {
                    "title": p.title,
                    "authors": p.authors,
                    "venue": p.venue,
                    "year": p.year or "",
                    "doi": p.doi or "",
                    "link": p.link or ""
                } for p in publications
            ],
        }

        # Read and populate template using V2 (no LLM calls — content already generated)
        latex_template = read_latex(file_path=main_tex_file)
        populated_content = make_latex_resume_v2(
            latex_content=latex_template,
            data=yaml_data,
            template_dir=template_dir,
            page_count=session.page_count or 1
        )

        # Write and compile
        write_latex(file_path=output_tex_file, content=populated_content)
        print(f"[finalize] Generated LaTeX written to {output_tex_file}")
        # Print first unreplaced xyz patterns (debugging)
        import re as _re
        remaining = _re.findall(r'xyz\w+xyz', populated_content)
        if remaining:
            print(f"[finalize] WARNING: Unreplaced patterns in LaTeX: {set(remaining)}")
        actual_pages = compile_pdf(main_tex_path=output_tex_file, output_dir=session_output_dir)
        print(f"[finalize] Compiled PDF: {actual_pages} page(s)")

        output_pdf_path = os.path.join(session_output_dir, "resume.pdf")

        return jsonify({
            "success": True,
            "session_id": session_id,
            "pdf_url": f"output/sessions/{session_id}/resume.pdf",
            "latex_content": populated_content,
            "template_used": template_id
        })

    except Exception as e:
        print(f"Error finalizing resume: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/resume/session/<int:session_id>", methods=["GET"])
@jwt_required()
def get_session(session_id):
    """Get current state of a generation session."""
    current_user = get_jwt_identity()

    session = GenerationSession.query.filter_by(
        id=session_id,
        user_id=current_user["id"]
    ).first()

    if not session:
        return jsonify({"error": "Session not found"}), 404

    questions = ClarifyingQuestion.query.filter_by(session_id=session_id).all()
    content = GeneratedContent.query.filter_by(session_id=session_id).all()

    return jsonify({
        "session_id": session.id,
        "session_state": session.session_state,
        "job_description": session.job_description,
        "extracted_keywords": session.extracted_keywords,
        "job_field": session.job_field,
        "template_id": session.template_id,
        "page_count": session.page_count,
        "questions": [{
            "id": q.id,
            "question_type": q.question_type,
            "target_entity": q.target_entity,
            "target_id": q.target_id,
            "target_name": q.target_name,
            "question_text": q.question_text,
            "input_type": q.input_type,
            "options": q.options,
            "context": q.context,
            "user_answer": q.user_answer,
            "answered": q.answered
        } for q in questions],
        "generated_content": [{
            "id": c.id,
            "content_type": c.content_type,
            "target_id": c.target_id,
            "original_text": c.original_text,
            "generated_text": c.generated_text,
            "keywords_used": c.keywords_used,
            "user_approved": c.user_approved,
            "user_edited_text": c.user_edited_text
        } for c in content]
    })

# ============================================================================
# LEGACY RESUME GENERATION ENDPOINT (V1)
# ============================================================================

@app.route("/api/resume/generate", methods=["POST"])
@jwt_required()
def generate_resume():
    current_user = get_jwt_identity()
    data = request.json
    job_description = data.get("job_description")

    if not job_description:
        return jsonify({"error": "Job description is required"}), 400

    try:
        # File paths
        template_dir = os.path.join(API_DIR, "templates", "template1")
        main_tex_file = os.path.join(template_dir, "main.tex")
        user_output_dir = os.path.join(OUTPUT_DIR, "legacy", str(current_user["id"]))
        os.makedirs(user_output_dir, exist_ok=True)
        output_tex_file = os.path.join(user_output_dir, "resume.tex")
        
        # Convert user data to dictionary
        user = User.query.filter_by(id=current_user["id"]).first()
        profile = Profile.query.filter_by(user_id=user.id).first()
        education = Education.query.filter_by(user_id=user.id).all()
        experience = Experience.query.filter_by(user_id=user.id).all()
        skills = Skill.query.filter_by(user_id=user.id).first()  # Fetch skills first
        projects = Project.query.filter_by(user_id=user.id).all()
        relevant_coursework = []
        for edu in education:
            relevant_coursework += edu.relevant_coursework
        
        relevant_coursework = "".join(relevant_coursework)

        yaml_data = {
            "name": user.name,
            "city": profile.city if profile else "",
            "state": profile.state if profile else "",
            "email": user.email,
            "number": profile.phone,  # Add phone number if available
            "linkedin": profile.linkedin if profile else "",
            "github": profile.github if profile else "",
            "website": profile.website,  # Add website if available
            "education": [
                {
                    "university": edu.university,
                    "gpa": edu.gpa,
                    "maxgpa": edu.max_gpa,  # Add max GPA if available
                    "startmonth": edu.start_date.split(" ")[0] if edu.start_date else "",
                    "startyear": edu.start_date.split(" ")[-1] if edu.start_date else "",
                    "endmonth": edu.end_date.split(" ")[0] if edu.end_date else "",
                    "endyear": edu.end_date.split(" ")[-1] if edu.end_date else "",
                    "degree": edu.degree,
                    "major": edu.major,
                    "specialization": edu.specialization,
                    "educity": edu.city,
                    "edustate": edu.state,
                    "educountry": edu.country
                } for edu in education
            ],
            "relevantcoursework": relevant_coursework,  # Add relevant coursework
            "skills": skills.skills,  # Add skills list
            "experience": [
                {
                    "position": exp.position,
                    "company": exp.company,
                    "startmonth": exp.start_date.split(" ")[0] if exp.start_date else "",
                    "startyear": exp.start_date.split(" ")[-1] if exp.start_date else "",
                    "endmonth": exp.end_date.split(" ")[0] if exp.end_date else "",
                    "endyear": exp.end_date.split(" ")[-1] if exp.end_date else "",
                    "current": exp.current,
                    "description": exp.description
                } for exp in experience
            ],
            "projects": [
                {
                    "name": proj.name,
                    "details": proj.details,
                    "link": proj.link,
                    "description": proj.description
                } for proj in projects
            ],
        }

        # Read LaTeX template
        latex_template = read_latex(file_path=main_tex_file)
        print("LaTeX template read successfully.")

        # Replace placeholders with YAML values and the provided job description
        populated_content = make_latex_resume(latex_content=latex_template, data=yaml_data, jobdescription=job_description, template_dir=template_dir)
        print("LaTeX resume populated successfully.")

        # Write populated LaTeX to a new file
        write_latex(file_path=output_tex_file, content=populated_content)
        print("Populated LaTeX written to file successfully.")

        # Compile the LaTeX file to PDF
        compile_pdf(main_tex_path=output_tex_file, output_dir=user_output_dir)
        print("LaTeX file compiled to PDF successfully.")

        # Return both the populated LaTeX content and the PDF file
        return jsonify({
            "pdf_url": f"output/legacy/{current_user['id']}/resume.pdf",
            "latex_content": populated_content
        })

    except Exception as e:
        print(f"Error generating resume: {e}")
        return jsonify({"error": "Failed to generate resume"}), 500

@app.route('/output/<path:filename>')
def serve_pdf(filename):
    return send_from_directory(OUTPUT_DIR, filename)

# Resume Sessions List
@app.route("/api/resume/sessions", methods=["GET"])
@jwt_required()
def get_resume_sessions():
    """Return all generation sessions for the current user."""
    current_user = get_jwt_identity()
    sessions = GenerationSession.query.filter_by(user_id=current_user["id"]).order_by(GenerationSession.created_at.desc()).all()
    return jsonify({
        "sessions": [
            {
                "id": s.id,
                "job_title": s.job_field or "Resume",
                "template_id": s.template_id,
                "page_count": s.page_count,
                "status": s.session_state,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions
        ]
    })

# ── Auth: Password Reset ───────────────────────────────────────────────────────

@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Send a password reset email via Resend."""
    from mailer import send_password_reset as _send_reset
    data = request.json or {}
    email = data.get("email", "").strip().lower()
    user = User.query.filter_by(email=email).first()
    # Always return success to avoid email enumeration
    if user:
        raw_token = secrets.token_urlsafe(32)
        user.reset_token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        user.reset_token_expires = datetime.utcnow() + timedelta(hours=1)
        db.session.commit()
        _send_reset(email, raw_token)
    return jsonify({"message": "If an account with that email exists, a reset link has been sent."}), 200

@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    """Validate reset token and update password."""
    data = request.json or {}
    token = data.get("token", "")
    new_password = data.get("password", "")
    if len(new_password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    user = User.query.filter_by(reset_token_hash=token_hash).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        return jsonify({"error": "Invalid or expired reset link"}), 400
    user.password = bcrypt.generate_password_hash(new_password).decode("utf-8")
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.session.commit()
    return jsonify({"message": "Password updated. You can now log in."}), 200

# ── Auth: Email Verification ───────────────────────────────────────────────────

@app.route("/api/auth/send-verification", methods=["POST"])
@jwt_required()
def send_verification():
    """Send email verification link to the current user."""
    from mailer import send_verification_email as _send_verify
    current_user = get_jwt_identity()
    user = User.query.get(current_user["id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    if user.email_verified:
        return jsonify({"message": "Already verified"}), 200
    raw_token = secrets.token_urlsafe(32)
    user.verify_token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    db.session.commit()
    _send_verify(user.email, raw_token)
    return jsonify({"message": "Verification email sent"}), 200

@app.route("/api/auth/verify-email", methods=["GET"])
def verify_email():
    """Verify email using token from the link."""
    token = request.args.get("token", "")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    user = User.query.filter_by(verify_token_hash=token_hash).first()
    if not user:
        return jsonify({"error": "Invalid or expired verification link"}), 400
    user.email_verified = True
    user.verify_token_hash = None
    db.session.commit()
    return jsonify({"message": "Email verified successfully"}), 200

# LinkedIn Profile Text Extraction
@app.route("/api/linkedin/extract", methods=["POST"])
@jwt_required()
def extract_linkedin():
    """Parse pasted LinkedIn profile text into structured education + experience data."""
    from gpt_v2 import get_llm_client
    data = request.json or {}
    edu_text = data.get("education_text", "").strip()
    exp_text = data.get("experience_text", "").strip()
    section = data.get("section", "both")  # "education", "experience", or "both"

    if section == "education":
        if len(edu_text) < 30:
            return jsonify({"error": "Please paste your Education section text"}), 400
        prompt = f"""Extract all education entries from this LinkedIn Education section text.

Return ONLY valid JSON array (no wrapping object):
[
  {{
    "university": "Full institution name",
    "degree": "Degree type e.g. Bachelor of Science",
    "major": "Field of study",
    "gpa": "",
    "max_gpa": "4.0",
    "start_date": "Mon YYYY e.g. Aug 2020",
    "end_date": "Mon YYYY or Present",
    "city": "", "state": "", "country": "",
    "relevant_coursework": ""
  }}
]

RULES: Do NOT invent anything. Ignore UI noise (buttons, icons, counts). Return raw JSON array only.

Education text:
{edu_text[:15000]}"""
        try:
            client = get_llm_client()
            model = os.getenv("LLM_MODEL", "gpt-4o-mini")
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0, max_tokens=5000,
            )
            raw = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                parsed = parsed.get("education", [])
            return jsonify({"education": parsed, "experience": []})
        except json.JSONDecodeError:
            return jsonify({"error": "Could not parse education. Try selecting just the Education section."}), 422
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    elif section == "experience":
        if len(exp_text) < 30:
            return jsonify({"error": "Please paste your Experience section text"}), 400
        prompt = f"""Extract all work experience entries from this LinkedIn Experience section text.

Return ONLY valid JSON array (no wrapping object):
[
  {{
    "position": "Job title",
    "company": "Company name",
    "start_date": "Mon YYYY e.g. Jun 2022",
    "end_date": "Mon YYYY or Present",
    "current": false,
    "description": "Description of the role combined into one paragraph"
  }}
]

RULES: Do NOT invent anything. Set current=true if end is Present. Ignore UI noise. Return raw JSON array only.

Experience text:
{exp_text[:30000]}"""
        try:
            client = get_llm_client()
            model = os.getenv("LLM_MODEL", "gpt-4o-mini")
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0, max_tokens=8000,
            )
            raw = response.choices[0].message.content.strip().strip("```json").strip("```").strip()
            parsed = json.loads(raw)
            if not isinstance(parsed, list):
                parsed = parsed.get("experience", [])
            return jsonify({"education": [], "experience": parsed})
        except json.JSONDecodeError:
            return jsonify({"error": "Could not parse experience. Try selecting just the Experience section."}), 422
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    profile_text = f"{edu_text}\n{exp_text}".strip()
    if len(profile_text) < 100:
        return jsonify({"error": "Please paste your LinkedIn profile text"}), 400

    prompt = f"""Extract education and experience from this LinkedIn text. Return ONLY valid JSON:
{{"education": [...], "experience": [...]}}
Ignore UI noise. Do not invent anything.

Text:
{profile_text[:5000]}"""

    try:
        client = get_llm_client()
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
        return jsonify(parsed)
    except json.JSONDecodeError:
        return jsonify({"error": "Could not parse the profile. Try pasting more text."}), 422
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Cover Letter Generation
@app.route("/api/cover-letter/generate", methods=["POST"])
@jwt_required()
def generate_cover_letter():
    """Generate a tailored cover letter from the user's profile and a job description."""
    from gpt_v2 import get_llm_client
    current_user = get_jwt_identity()
    data = request.json or {}
    job_description = data.get("job_description", "")
    tone = data.get("tone", "professional")
    highlights = data.get("highlights", "")

    if len(job_description) < 100:
        return jsonify({"error": "Job description too short"}), 400

    # Fetch user profile data
    profile = Profile.query.filter_by(user_id=current_user["id"]).first()
    experiences = Experience.query.filter_by(user_id=current_user["id"]).order_by(Experience.end_date.desc()).limit(3).all()
    skills_row = Skill.query.filter_by(user_id=current_user["id"]).first()

    profile_text = ""
    if profile:
        profile_text += f"Name: {profile.full_name or ''}\n"
        profile_text += f"LinkedIn: {profile.linkedin or ''}\n"
    for exp in experiences:
        profile_text += f"\nRole: {exp.position} at {exp.company}\n"
        if exp.description:
            profile_text += f"Description: {exp.description[:300]}\n"
    if skills_row and skills_row.skills:
        profile_text += f"\nSkills: {skills_row.skills[:300]}\n"
    if highlights:
        profile_text += f"\nUser wants to highlight: {highlights}\n"

    tone_instruction = {
        "professional": "Write in a formal, polished tone.",
        "enthusiastic": "Write in an energetic, passionate tone that shows genuine excitement for the role.",
        "concise": "Write concisely — keep it to 3 short paragraphs maximum.",
    }.get(tone, "Write in a professional tone.")

    prompt = f"""You are a professional career coach writing a cover letter. {tone_instruction}

STRICT RULES:
- ONLY use information from the user's profile below. Do NOT invent metrics, achievements, or technologies.
- Do NOT fabricate any numbers or outcomes.
- Use exact keywords from the job description for ATS optimization.
- Address it to "Hiring Manager" if no name is available.
- Keep it to 3-4 paragraphs, under 400 words.

USER PROFILE:
{profile_text}

JOB DESCRIPTION:
{job_description[:2000]}

Write the full cover letter now (no subject line, no date header — just the letter body starting with "Dear Hiring Manager,"):"""

    try:
        client = get_llm_client()
        model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=700,
        )
        cover_letter = response.choices[0].message.content.strip()
        return jsonify({"cover_letter": cover_letter})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Resume PDF Download
@app.route("/api/resume/download/<int:session_id>", methods=["GET"])
@jwt_required()
def download_resume(session_id):
    """Serve the compiled PDF for a given session."""
    current_user = get_jwt_identity()
    session = GenerationSession.query.filter_by(id=session_id, user_id=current_user["id"]).first()
    if not session:
        return jsonify({"error": "Session not found"}), 404
    pdf_path = os.path.join(OUTPUT_DIR, "sessions", str(session_id), "resume.pdf")
    if not os.path.exists(pdf_path):
        return jsonify({"error": "PDF not found"}), 404
    return send_file(pdf_path, mimetype="application/pdf", as_attachment=True, download_name=f"resume-{session_id}.pdf")

# ATS Score Preview
@app.route("/api/resume/ats-preview", methods=["POST"])
@jwt_required()
def ats_preview():
    """Compare user skills vs job description keywords, return a quick ATS score."""
    current_user = get_jwt_identity()
    data = request.json or {}
    job_description = data.get("job_description", "")
    if len(job_description) < 100:
        return jsonify({"error": "Job description too short"}), 400

    skill_row = Skill.query.filter_by(user_id=current_user["id"]).first()
    raw_skills = skill_row.skills if skill_row and skill_row.skills else ""
    user_skills = [s.strip().lower() for s in raw_skills.split(",") if s.strip()]

    jd_lower = job_description.lower()
    import re
    jd_words = set(w.strip(".,();:\"'") for w in re.split(r'\s+', jd_lower) if len(w) > 3)

    matched = [s for s in user_skills if s in jd_lower]
    missing = [w for w in list(jd_words - set(user_skills)) if not w.isdigit()][:10]
    score = int((len(matched) / max(len(user_skills), 1)) * 100)

    return jsonify({
        "score": min(score, 100),
        "matched_keywords": matched[:15],
        "missing_skills": missing,
    })

# ── Job Tracker CRUD ──────────────────────────────────────────────────────────

def _job_to_dict(j: JobApplication) -> dict:
    return {
        "id": j.id,
        "company": j.company,
        "role": j.role,
        "status": j.status,
        "url": j.url,
        "notes": j.notes,
        "salary": j.salary,
        "location": j.location,
        "created_at": j.created_at.isoformat() if j.created_at else None,
    }

@app.route("/api/jobs", methods=["GET"])
@jwt_required()
def get_jobs():
    current_user = get_jwt_identity()
    jobs = JobApplication.query.filter_by(user_id=current_user["id"]).order_by(JobApplication.created_at.desc()).all()
    return jsonify({"jobs": [_job_to_dict(j) for j in jobs]})

@app.route("/api/jobs", methods=["POST"])
@jwt_required()
def create_job():
    current_user = get_jwt_identity()
    data = request.json or {}
    if not data.get("company") or not data.get("role"):
        return jsonify({"error": "company and role are required"}), 400
    job = JobApplication(
        user_id=current_user["id"],
        company=data["company"],
        role=data["role"],
        status=data.get("status", "wishlist"),
        url=data.get("url"),
        notes=data.get("notes"),
        salary=data.get("salary"),
        location=data.get("location"),
    )
    db.session.add(job)
    db.session.commit()
    return jsonify(_job_to_dict(job)), 201

@app.route("/api/jobs/<int:job_id>", methods=["PATCH"])
@jwt_required()
def update_job(job_id):
    current_user = get_jwt_identity()
    job = JobApplication.query.filter_by(id=job_id, user_id=current_user["id"]).first()
    if not job:
        return jsonify({"error": "Not found"}), 404
    data = request.json or {}
    for field in ("company", "role", "status", "url", "notes", "salary", "location"):
        if field in data:
            setattr(job, field, data[field])
    db.session.commit()
    return jsonify(_job_to_dict(job))

@app.route("/api/jobs/<int:job_id>", methods=["DELETE"])
@jwt_required()
def delete_job(job_id):
    current_user = get_jwt_identity()
    job = JobApplication.query.filter_by(id=job_id, user_id=current_user["id"]).first()
    if not job:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(job)
    db.session.commit()
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(debug=True)
