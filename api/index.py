from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import os
import json
from dataclasses import asdict
from resumeMaker import make_latex_resume, read_latex, write_latex, compile_pdf
from gpt_v2 import (
    analyze_job_description,
    generate_clarifying_questions,
    generate_grounded_bullets,
    generate_skills_section,
    select_content_for_page_count,
    JobAnalysis
)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"  # Change to PostgreSQL/MySQL in production
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "afeuhwoi2839or2224902h4r880820804#(@*$#)&093U"  # Change this in production

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

# Resume Generation Session Models
class GenerationSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    job_description = db.Column(db.Text, nullable=False)
    extracted_keywords = db.Column(db.JSON)  # Store as JSON
    job_field = db.Column(db.String(50))  # software, ai, data, etc.
    years_required = db.Column(db.Integer)
    session_state = db.Column(db.String(50), default='analyzing')  # analyzing, questions, generating, review, template, complete
    template_id = db.Column(db.String(50), default='classic')
    page_count = db.Column(db.Integer, default=1)
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

    return jsonify({"onboarding_completed": user.onboarding_completed})

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

    return jsonify({
        "user": {
            "name": user.name,
            "email": user.email,
            "city": profile.city if profile else None,  # Added check for profile existence
            "state": profile.state if profile else None,  # Added check for profile existence
            "linkedin": profile.linkedin if profile else None,  # Added check for profile existence
            "github": profile.github if profile else None,  # Added check for profile existence
            "number": profile.phone if profile else None,  # Added check for profile existence
            "website": profile.website if profile else None,  # Added check for profile existence
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
        "skills": skills.skills if skills else []  # Added skills to the response
    })

# ============================================================================
# NEW AGENTIC RESUME GENERATION ENDPOINTS (V2)
# ============================================================================

# Template configurations
TEMPLATES = {
    "classic": {
        "id": "classic",
        "name": "Classic Professional",
        "description": "Traditional resume format with clear sections",
        "ats_compliant": True,
        "section_order": ["education", "skills", "experience", "projects"],
        "supports_two_page": True,
        "preview_image": "/templates/classic/preview.png"
    },
    "modern": {
        "id": "modern",
        "name": "Modern Clean",
        "description": "Clean lines with subtle section dividers",
        "ats_compliant": True,
        "section_order": ["summary", "skills", "experience", "projects", "education"],
        "supports_two_page": True,
        "preview_image": "/templates/modern/preview.png"
    },
    "minimal": {
        "id": "minimal",
        "name": "Minimal",
        "description": "Maximum white space, distraction-free",
        "ats_compliant": True,
        "section_order": ["experience", "projects", "skills", "education"],
        "supports_two_page": True,
        "preview_image": "/templates/minimal/preview.png"
    },
    "skills-first": {
        "id": "skills-first",
        "name": "Skills First (2026 Trend)",
        "description": "Skills prominently featured at top for ATS",
        "ats_compliant": True,
        "section_order": ["skills", "experience", "projects", "education"],
        "supports_two_page": True,
        "preview_image": "/templates/skills-first/preview.png"
    },
    "executive": {
        "id": "executive",
        "name": "Executive",
        "description": "Larger margins, suitable for senior roles",
        "ats_compliant": True,
        "section_order": ["summary", "experience", "skills", "education", "projects"],
        "supports_two_page": True,
        "preview_image": "/templates/executive/preview.png"
    },
    "ats-optimized": {
        "id": "ats-optimized",
        "name": "ATS Optimized",
        "description": "Plain text-like format for maximum ATS compatibility",
        "ats_compliant": True,
        "section_order": ["skills", "experience", "projects", "education"],
        "supports_two_page": True,
        "preview_image": "/templates/ats-optimized/preview.png"
    }
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

        # Create session
        session = GenerationSession(
            user_id=current_user["id"],
            job_description=job_description,
            extracted_keywords=job_analysis.keywords,
            job_field=job_analysis.job_field,
            years_required=job_analysis.years_required,
            session_state="questions"
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

        projects_data = [{
            "id": proj.id,
            "name": proj.name,
            "description": proj.description,
            "details": proj.details,
            "link": proj.link
        } for proj in projects]

        # Generate clarifying questions
        questions = generate_clarifying_questions(
            job_analysis,
            experiences_data,
            projects_data,
            skills.skills if skills else ""
        )

        # Store questions in database
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

        # Return session data
        return jsonify({
            "session_id": session.id,
            "job_analysis": asdict(job_analysis),
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
            "projects": projects_data
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
            job_title="",
            job_field=session.job_field or "other",
            years_required=session.years_required or 0,
            required_skills=[],
            preferred_skills=[],
            keywords=session.extracted_keywords or [],
            key_responsibilities=[],
            company_values=[]
        )

        # Fetch user data
        experiences = Experience.query.filter_by(user_id=current_user["id"]).all()
        projects = Project.query.filter_by(user_id=current_user["id"]).all()
        skills = Skill.query.filter_by(user_id=current_user["id"]).first()

        # Get user answers
        questions = ClarifyingQuestion.query.filter_by(session_id=session_id).all()
        answers = {q.id: q.user_answer for q in questions if q.answered}

        # Select content based on page count
        page_count = session.page_count or 1
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
            [{
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "details": proj.details,
                "link": proj.link
            } for proj in projects],
            job_analysis,
            page_count
        )

        generated_content = []

        # Generate bullets for experiences
        for exp_data in selection["experiences"]:
            relevant_qs = [{"id": q.id, "question_text": q.question_text}
                         for q in questions
                         if q.target_entity == "experience" and q.target_id == exp_data.get("_original_index")]

            bullets = generate_grounded_bullets(
                job_analysis,
                "experience",
                exp_data,
                exp_data.get("id"),
                answers,
                relevant_qs,
                exp_data.get("_bullets_count", 3)
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
                generated_content.append({
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
            relevant_qs = [{"id": q.id, "question_text": q.question_text}
                         for q in questions
                         if q.target_entity == "project" and q.target_id == proj_data.get("_original_index")]

            bullets = generate_grounded_bullets(
                job_analysis,
                "project",
                proj_data,
                proj_data.get("id"),
                answers,
                relevant_qs,
                proj_data.get("_bullets_count", 2)
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
                generated_content.append({
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
    template_id = data.get("template_id", "classic")
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

        # Get approved content
        generated_content = GeneratedContent.query.filter_by(
            session_id=session_id
        ).all()

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
        template_id = session.template_id or "classic"
        # For now, use template1 as fallback until other templates are created
        template_dir = f"api/templates/{template_id}"
        if not os.path.exists(template_dir):
            template_dir = "api/templates/template1"

        main_tex_file = os.path.join(template_dir, "main.tex")
        output_tex_file = f"api/output/output_{session_id}.tex"
        output_directory = "output"

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
            "experience": [
                {
                    "position": exp.position,
                    "company": exp.company,
                    "startmonth": exp.start_date.split(" ")[0] if exp.start_date else "",
                    "startyear": exp.start_date.split(" ")[-1] if exp.start_date else "",
                    "endmonth": exp.end_date.split(" ")[0] if exp.end_date else "",
                    "endyear": exp.end_date.split(" ")[-1] if exp.end_date else "",
                    "current": exp.current,
                    "description": exp.description,
                    # Add generated bullets
                    "generated_bullets": experience_bullets.get(exp.id, [])
                } for exp in experiences
            ],
            "projects": [
                {
                    "name": proj.name,
                    "details": proj.details,
                    "link": proj.link,
                    "description": proj.description,
                    # Add generated bullets
                    "generated_bullets": project_bullets.get(proj.id, [])
                } for proj in projects
            ],
        }

        # Read and populate template
        latex_template = read_latex(file_path=main_tex_file)
        populated_content = make_latex_resume(
            latex_content=latex_template,
            data=yaml_data,
            jobdescription=session.job_description,
            template_dir=template_dir
        )

        # Write and compile
        write_latex(file_path=output_tex_file, content=populated_content)
        compile_pdf(main_tex_path=output_tex_file, output_dir=output_directory)

        output_pdf_name = f"output_{session_id}.pdf"
        output_pdf_path = os.path.join(output_directory, output_pdf_name)

        return jsonify({
            "success": True,
            "session_id": session_id,
            "pdf_url": output_pdf_path,
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
        template_dir = "api/templates/template1"
        main_tex_file = os.path.join(template_dir, "main.tex")
        output_tex_file = "api/output/output.tex"
        output_directory = "output"
        
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
        compile_pdf(main_tex_path=output_tex_file, output_dir=output_directory)
        print("LaTeX file compiled to PDF successfully.")

        # Path to the generated PDF
        output_pdf_path = os.path.join(output_directory, "output.pdf")
        print("PDF path generated successfully.")
        
        # Return both the populated LaTeX content and the PDF file
        return jsonify({
            "pdf_url": output_pdf_path,
            "latex_content": populated_content
        })

    except Exception as e:
        print(f"Error generating resume: {e}")
        return jsonify({"error": "Failed to generate resume"}), 500

@app.route('/output/<path:filename>')
def serve_pdf(filename):
    return send_from_directory('output', filename)

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

# Forgot Password (stub)
@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Password reset stub — returns confirmation without sending email."""
    data = request.json or {}
    email = data.get("email", "")
    # Stub: In production, trigger an email reset flow here.
    return jsonify({"message": "If an account with that email exists, a reset link has been sent."}), 200

if __name__ == "__main__":
    app.run(debug=True)
