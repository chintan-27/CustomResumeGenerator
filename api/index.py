from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
import os
from resumeMaker import make_latex_resume, read_latex, write_latex, compile_pdf

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

# Update User Profile (Onboarding)
@app.route("/api/user/profile", methods=["POST"])
@jwt_required()
def create_or_update_profile():
    current_user = get_jwt_identity()
    profile = Profile.query.filter_by(user_id=current_user["id"]).first()

    data = request.json

    if not profile:
        # Create a new profile if it doesn't exist
        profile = Profile(
            user_id=current_user["id"],
            city=data.get("city"),
            state=data.get("state"),
            linkedin=data.get("linkedin"),
            github=data.get("github"),
            phone=data.get("number"),
            website=data.get("website")
        )
        db.session.add(profile)
    else:
        # Update existing profile
        profile.city = data.get("city")
        profile.state = data.get("state")
        profile.linkedin = data.get("linkedin")
        profile.github = data.get("github")
        profile.onboarding_completed = True

    db.session.commit()
    return jsonify({"message": "Profile created or updated successfully"})

# Add Education Record
@app.route("/api/user/education", methods=["POST"])
@jwt_required()
def add_education():
    current_user = get_jwt_identity()
    data = request.json

    print(data)

    new_education = Education(
        user_id=current_user["id"],
        university=data.get("university"),
        gpa=data.get("gpa"),
        max_gpa=data.get("max_gpa"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        degree=data.get("degree"),
        major=data.get("major"),
        specialization=data.get("specialization"),
        city=data.get("city"),
        state=data.get("state"),
        country=data.get("country"),
        relevant_coursework=", ".join(data.get("relevantCoursework"))
    )
    db.session.add(new_education)
    db.session.commit()
    return jsonify({"message": "Education record added successfully"})

# Add Experience Record
@app.route("/api/user/experience", methods=["POST"])
@jwt_required()
def add_experience():
    current_user = get_jwt_identity()
    data = request.json

    new_experience = Experience(
        user_id=current_user["id"],
        position=data.get("position"),
        company=data.get("company"),
        start_date=data.get("start_date"),
        end_date=data.get("end_date"),
        current=data.get("current", False),
        description=data.get("description")
    )
    db.session.add(new_experience)
    db.session.commit()
    return jsonify({"message": "Experience record added successfully"})

# Add Project Record
@app.route("/api/user/project", methods=["POST"])
@jwt_required()
def add_project():
    current_user = get_jwt_identity()
    data = request.json

    new_project = Project(
        user_id=current_user["id"],
        name=data.get("name"),
        description=data.get("description"),
        link=data.get("link"),
        details=data.get("details")
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify({"message": "Project record added successfully"})

# Add Skills
@app.route("/api/user/skills", methods=["POST"])
@jwt_required()
def add_skills():
    current_user = get_jwt_identity()
    data = request.json

    new_project = Skill(
        user_id=current_user["id"],
        skills=data.get("skills")
    )
    db.session.add(new_project)
    db.session.commit()
    return jsonify({"message": "Project record added successfully"})

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
        
        # Replace placeholders with YAML values and the provided job description
        populated_content = make_latex_resume(latex_content=latex_template, data=yaml_data, jobdescription=job_description, template_dir=template_dir)
        
        # Write populated LaTeX to a new file
        write_latex(file_path=output_tex_file, content=populated_content)

        # Compile the LaTeX file to PDF
        compile_pdf(main_tex_path=output_tex_file, output_dir=output_directory)
        
        # Path to the generated PDF
        output_pdf_path = os.path.join(output_directory, "output.pdf")
        
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

if __name__ == "__main__":
    app.run(debug=True)
