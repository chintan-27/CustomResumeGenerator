import yaml
import re
from jinja2 import Template
import subprocess
import os
from gpt import extractExperienceAndSkills, getRelevanceScore, getSkills, generatePoints
from datetime import datetime


useMoreSpace = 0
useLessSpace = 0

# Load YAML data
def load_yaml(file_path):
    with open(file_path, 'r') as f:
        data = yaml.safe_load(f)
    return data  # return the yaml data as dict

# Read LaTeX file
def read_latex(file_path):
    with open(file_path, 'r') as f:
        return f.read()

# Write updated LaTeX content
def write_latex(file_path, content):
    with open(file_path, 'w') as f:
        f.write(content)

#Extract the patterns
def extract_patterns(latex_content):
    pattern = r'xyz(.*?)xyz'
    return re.findall(pattern, latex_content)

#Handle Education
def handle_education(latex_content, data, education_latex_file):
    education_latex_og = read_latex(education_latex_file)
    final_education_latex = []
    global useMoreSpace, useLessSpace
    useMoreSpace = (len(data) < 2)
    for education in data:
        education_latex = education_latex_og.split("-----")[0]
        extracted_patterns = list(set(extract_patterns(education_latex)))
        for pattern in extracted_patterns:
            if pattern != "duration":
                education_latex = education_latex.replace(f"xyz{pattern}xyz", str(education.get(pattern) or ""))
            else:
                duration = f"{education['startmonth'][:3]} {education['startyear']} - {education['endmonth'][:3]} {education['endyear']}"
                education_latex = education_latex.replace("xyzdurationxyz", duration)
        final_education_latex.append(education_latex)

    if len(final_education_latex) < 2:
        useMoreSpace += 1
    elif len(final_education_latex) > 2: 
        useLessSpace += 1

    inbetween_latex = education_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_education_latex = inbetween_latex.join(final_education_latex)
    latex_content = latex_content.replace("xyzeducationxyz", final_education_latex)
    return latex_content


# Calculate duration of the experience 
def calculate_experience_duration(experience):
    # Get current date if the experience is current
    if experience['current']:
        end_date = datetime.now()
    else:
        end_date = datetime.strptime(f"{experience['endmonth']} {experience['endyear']}", "%b %Y")

    start_date = datetime.strptime(f"{experience['startmonth']} {experience['startyear']}", "%b %Y")
    # Calculate the difference in years
    duration = end_date - start_date
    years = duration.days / 365.25  # Approximate years considering leap years
    return round(years, 2)  # Return duration rounded to 2 decimal places



# Handle Experience
def handle_experience(latex_content, data, keywords, jobdescription, experience_latex_file):
    # Sort experiences by start date in descending order
    sorted_experiences = sorted(data, key=lambda x: x[0], reverse=True)

    global useLessSpace, useMoreSpace 
    if len(data) > 3:
        useLessSpace += 1
    elif len(data) < 3:
        useMoreSpace += 1
    
    
    # Read the original LaTeX template for experience
    experience_latex_og = read_latex(experience_latex_file)
    final_experience_latex = []

    # Iterate through sorted experiences
    for index, experienceTuple in enumerate(sorted_experiences):
        experience = experienceTuple[1]

        # Determine the number of points to generate based on experience index
        if index == 0:
            points_count = 4
        elif index in [1, 2]:
            points_count = 2
        else:
            points_count = 1
        
        # Generate bullet points for the experience
        generated_points = generatePoints(experience, "experience", jobdescription, keywords, points_count)
        
        # Prepare LaTeX for the current experience
        experience_latex = experience_latex_og.split("-----")[0]
        extracted_patterns = list(set(extract_patterns(experience_latex)))

        # Replace patterns in the LaTeX template
        for pattern in extracted_patterns:
            if pattern == "duration":
                # Format the duration of the experience
                duration = (f"{experience['startmonth'][:3]} {experience['startyear']} - "
                            f"{experience['endmonth'][:3]} {experience['endyear']}" 
                            if experience['endmonth'] and experience['endyear'] 
                            else f"{experience['startmonth'][:3]} {experience['startyear']} - Present")
                experience_latex = experience_latex.replace("xyzdurationxyz", duration)
            elif pattern != "points":
                # Replace other patterns with corresponding experience data
                experience_latex = experience_latex.replace(f"xyz{pattern}xyz", str(experience.get(pattern) or ""))
            else:
                # Handle points replacement
                points = ("\n".join([r"\item " + point.replace('%', r'\%').replace('$', r'\$').strip() 
                                     for point in generated_points]) 
                          if generated_points else r"\item No points available.")
                experience_latex = experience_latex.replace("xyzpointsxyz", points)

        # Append the formatted experience LaTeX to the final list
        final_experience_latex.append((experience["startmonth"], experience["startyear"], experience_latex))

    # Sort final experiences by year and month
    final_experience_latex.sort(key=lambda x: (x[1], x[0]), reverse=True)  
    final_experience_latex = [experience_latex for _, _, experience_latex in final_experience_latex]

    # Prepare the in-between LaTeX content
    inbetween_latex = experience_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_experience_latex = inbetween_latex.join(final_experience_latex)

    # Replace the placeholder in the main LaTeX content
    latex_content = latex_content.replace("xyzexperiencexyz", final_experience_latex)
    
    return latex_content

# Handle Projects
def handle_projects(latex_content, data, points_count, jobdescription, keywords, projects_latex_file):
    # Read the latex
    projects_latex_og = read_latex(projects_latex_file)
    final_projects_latex = []
    for index, project in enumerate(data):
        project = project[1]
        points = generatePoints(project, "Project", jobdescription, keywords, points_count[index])

        project_latex = projects_latex_og.split("-----")[0]
        extracted_patterns = list(set(extract_patterns(project_latex)))
        for pattern in extracted_patterns:
            if pattern == "points":
                points = "\n".join([r"\item " + point.replace('%', r'\%').replace('$', r'\$') for point in points]) if points else r"\item No points available."
                project_latex = project_latex.replace("xyzpointsxyz", points)
            else:
                project_latex = project_latex.replace(f"xyz{pattern}xyz", str(project.get(pattern) or ""))
        final_projects_latex.append(project_latex)

    inbetween_latex = projects_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_projects_latex = inbetween_latex.join(final_projects_latex)
    latex_content = latex_content.replace("xyzprojectsxyz", final_projects_latex)
    return latex_content


def _escape_latex(text: str) -> str:
    """Escape special LaTeX characters in plain text."""
    if not text:
        return ""
    # Order matters: backslash first, then others
    replacements = [
        ('\\', r'\textbackslash{}'),
        ('&',  r'\&'),
        ('%',  r'\%'),
        ('$',  r'\$'),
        ('#',  r'\#'),
        ('_',  r'\_'),
        ('^',  r'\^{}'),
        ('~',  r'\textasciitilde{}'),
    ]
    for char, escaped in replacements:
        text = text.replace(char, escaped)
    return text


def _format_bullets(bullets):
    """Convert a list of bullet strings into LaTeX \\item lines."""
    if not bullets:
        return r"\item No points available."
    return "\n".join(
        r"\item " + _escape_latex(b.strip())
        for b in bullets if b.strip()
    )


def _deduplicate_bullets(bullets: list) -> list:
    """Remove near-duplicate bullets using word-overlap heuristic (>65% overlap = duplicate)."""
    seen = []
    unique = []
    for bullet in bullets:
        if not bullet or not bullet.strip():
            continue
        words = set(bullet.lower().split())
        overlap = max(
            (len(words & prev) / max(len(words), len(prev)) for prev in seen if prev),
            default=0
        )
        if overlap <= 0.65:
            unique.append(bullet)
            seen.append(words)
    return unique


def make_latex_resume_v2(latex_content, data, template_dir, page_count: int = 1):
    """
    Fill a LaTeX template using pre-generated content (V2 agentic flow).
    No LLM calls — uses generated_bullets already attached to each experience/project.
    page_count controls spacing tightness and content limits.
    """
    global useMoreSpace, useLessSpace
    useMoreSpace = 0
    useLessSpace = 0

    # For 1-page: inject tighter spacing overrides right after \begin{document}
    # Note: only inject \setlist (requires enumitem, always loaded) — NOT \titlespacing
    # because titlesec is not loaded in the new templates.
    if page_count == 1:
        latex_content = latex_content.replace(
            r'\begin{document}',
            r'\begin{document}' + '\n'
            r'\setlist[itemize]{itemsep=-4pt, topsep=0pt, parsep=0pt}'
        )

    extracted_patterns = list(set(extract_patterns(latex_content)))

    # Ensure projects is last (space handling)
    if "projects" in extracted_patterns:
        extracted_patterns.remove("projects")
        extracted_patterns.append("projects")

    education_latex_og = read_latex(os.path.join(template_dir, "education.tex"))
    experience_latex_og = read_latex(os.path.join(template_dir, "experience.tex"))
    projects_latex_og = read_latex(os.path.join(template_dir, "projects.tex"))

    for pattern in extracted_patterns:

        if pattern == 'certsection':
            certs = data.get('certifications', [])
            if certs:
                cert_latex_og = read_latex(os.path.join(template_dir, "certification.tex"))
                final_certs = []
                for c in certs:
                    cert_latex = cert_latex_og.split("-----")[0]
                    cert_latex = cert_latex.replace("xyznamexyz", _escape_latex(c.get("name", "")))
                    cert_latex = cert_latex.replace("xyzissuerxyz", _escape_latex(c.get("issuer", "")))
                    cert_latex = cert_latex.replace("xyzdatexyz", _escape_latex(c.get("date_issued", "")))
                    final_certs.append(cert_latex)
                sep = cert_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
                section = (
                    "\n\\vspace{-6pt}\n\\section*{Certifications}\n"
                    "\\begin{itemize}[leftmargin=1.5em, itemsep=2pt, topsep=1pt]\n"
                    + sep.join(final_certs)
                    + "\n\\end{itemize}\n"
                )
                latex_content = latex_content.replace("xyzcertsectionxyz", section)
            else:
                latex_content = latex_content.replace("xyzcertsectionxyz", "")

        elif pattern == 'pubsection':
            pubs = data.get('publications', [])
            if pubs:
                pub_latex_og = read_latex(os.path.join(template_dir, "publication.tex"))
                final_pubs = []
                for p in pubs:
                    pub_latex = pub_latex_og.split("-----")[0]
                    pub_latex = pub_latex.replace("xyztitlexyz", _escape_latex(p.get("title", "")))
                    pub_latex = pub_latex.replace("xyzauthorsxyz", _escape_latex(p.get("authors", "")))
                    pub_latex = pub_latex.replace("xyzvenuexyz", _escape_latex(p.get("venue", "")))
                    pub_latex = pub_latex.replace("xyzyearxyz", _escape_latex(p.get("year", "")))
                    final_pubs.append(pub_latex)
                sep = pub_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
                section = (
                    "\n\\vspace{-6pt}\n\\section*{Publications}\n"
                    "\\begin{itemize}[leftmargin=1.5em, itemsep=4pt, topsep=1pt]\n"
                    + sep.join(final_pubs)
                    + "\n\\end{itemize}\n"
                )
                latex_content = latex_content.replace("xyzpubsectionxyz", section)
            else:
                latex_content = latex_content.replace("xyzpubsectionxyz", "")

        elif pattern not in ['experience', 'education', 'projects', 'skills']:
            latex_content = latex_content.replace(f"xyz{pattern}xyz", _escape_latex(str(data.get(pattern) or "")))

        elif pattern == 'education':
            useMoreSpace += (1 if len(data.get('education', [])) < 2 else 0)
            useLessSpace += (1 if len(data.get('education', [])) > 2 else 0)
            final_edu = []
            for edu in data.get('education', []):
                edu_latex = education_latex_og.split("-----")[0]
                for p in list(set(extract_patterns(edu_latex))):
                    if p == "duration":
                        dur = f"{edu.get('startmonth','')[:3]} {edu.get('startyear','')} - {edu.get('endmonth','')[:3]} {edu.get('endyear','')}"
                        edu_latex = edu_latex.replace("xyzdurationxyz", dur)
                    else:
                        edu_latex = edu_latex.replace(f"xyz{p}xyz", _escape_latex(str(edu.get(p) or "")))
                final_edu.append(edu_latex)
            sep = education_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
            latex_content = latex_content.replace("xyzeducationxyz", sep.join(final_edu))

        elif pattern == 'skills':
            # Use pre-organized skills dict from V2 pipeline
            skills_organized = data.get('skills_organized', {})
            if skills_organized and isinstance(skills_organized, dict):
                skills_lines = []
                for category, skill_list in skills_organized.items():
                    if skill_list:
                        skills_lines.append(f"\\item \\textbf{{{_escape_latex(category)}}}: {', '.join(_escape_latex(s) for s in skill_list)}")
                latex_content = latex_content.replace("xyzskillsxyz", "\n".join(skills_lines))
            else:
                # Fallback: raw skills string
                raw = str(data.get('skills') or "")
                latex_content = latex_content.replace("xyzskillsxyz", f"\\item {raw}" if raw else "")

        elif pattern == 'experience':
            experiences = data.get('experience', [])
            useMoreSpace += (1 if len(experiences) < 3 else 0)
            useLessSpace += (1 if len(experiences) > 3 else 0)
            final_exp = []
            for exp in experiences:
                exp_latex = experience_latex_og.split("-----")[0]
                for p in list(set(extract_patterns(exp_latex))):
                    if p == "duration":
                        dur = (f"{exp.get('startmonth','')[:3]} {exp.get('startyear','')} - "
                               f"{exp.get('endmonth','')[:3]} {exp.get('endyear','')}"
                               if exp.get('endmonth') and exp.get('endyear')
                               else f"{exp.get('startmonth','')[:3]} {exp.get('startyear','')} - Present")
                        exp_latex = exp_latex.replace("xyzdurationxyz", dur)
                    elif p == "points":
                        bullets = _deduplicate_bullets(exp.get('generated_bullets', []))
                        exp_latex = exp_latex.replace("xyzpointsxyz", _format_bullets(bullets))
                    else:
                        exp_latex = exp_latex.replace(f"xyz{p}xyz", _escape_latex(str(exp.get(p) or "")))
                final_exp.append((exp.get('startmonth', ''), exp.get('startyear', ''), exp_latex))
            final_exp.sort(key=lambda x: (x[1], x[0]), reverse=True)
            sep = experience_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
            latex_content = latex_content.replace("xyzexperiencexyz", sep.join(e for _, _, e in final_exp))

        elif pattern == 'projects':
            projects = data.get('projects', [])
            space = useMoreSpace - useLessSpace
            # Limit projects based on space
            if space <= -2:
                projects = projects[:1]
            elif space < 0:
                projects = projects[:2]
            else:
                projects = projects[:3]

            final_proj = []
            for proj in projects:
                proj_latex = projects_latex_og.split("-----")[0]
                for p in list(set(extract_patterns(proj_latex))):
                    if p == "points":
                        bullets = _deduplicate_bullets(proj.get('generated_bullets', []))
                        proj_latex = proj_latex.replace("xyzpointsxyz", _format_bullets(bullets))
                    else:
                        proj_latex = proj_latex.replace(f"xyz{p}xyz", _escape_latex(str(proj.get(p) or "")))
                final_proj.append(proj_latex)
            sep = projects_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
            latex_content = latex_content.replace("xyzprojectsxyz", sep.join(final_proj))

    return latex_content


# Replace placeholders with YAML values
def make_latex_resume(latex_content, data, jobdescription ,template_dir):

    # Extract xyz___xyz patterns from templates
    extracted_patterns = list(set(extract_patterns(latex_content)))
    years_of_experience, skills_required, keywords = extractExperienceAndSkills(jobdescription)

    # Adding project to the last position, since that's where the space handling is done
    extracted_patterns.remove("projects")
    extracted_patterns.append("projects")

    for pattern in extracted_patterns:

        # Append the simple ones
        if pattern not in ['experience', 'education', 'projects', 'skills']:
            pass 

    for pattern in extracted_patterns:

        # Append the simple ones
        if pattern not in ['experience', 'education', 'projects', 'skills']:
            if pattern == 'specialization':
                data[pattern] = ", " + pattern
            latex_content = latex_content.replace(f"xyz{pattern}xyz", str(data.get(pattern) or ""))

        # Handle Skills
        elif pattern == "skills":

            # Use GPT to get the relevant skills
            skills = getSkills(jobdescription, data["skills"]).split("\n")
            skills_latex = []
            for skill in skills:
                skills_latex.append(f"\\item {skill}")
            latex_content = latex_content.replace("xyzskillsxyz", "\n".join(skills_latex))

        # Handle Education    
        elif pattern == 'education':
            latex_content = handle_education(latex_content, data['education'], os.path.join(template_dir, "education.tex"))

        # Handle Experience
        elif pattern == 'experience':
            experiences = data['experience']
            current_index = -1
            scores = []
            final_experiences = []
            
            # Finding relevance scores for all the experiences
            for index, experience in enumerate(experiences):
                
                experience["duration"] = calculate_experience_duration(experience)
                score = getRelevanceScore(jobdescription, str(experience))

                # If the experience is the current experience add it by default with the score for future use
                if experience['current']:
                    final_experiences.append((score, experience))

                    # Store the index to remove the current experience from the list so we don't pick duplicates
                    current_index = index
                else:
                    scores.append(score)

            # Remove the current experience using the index
            if current_index != -1:
                experiences.pop(current_index)
            
            # Sorting experience w.r.t. the relevance scores 
            sorted_experiences = sorted(zip(scores, experiences), key=lambda x: x[0], reverse=True)

            # Picking the 2 most relevant experiences
            final_experiences.extend(sorted_experiences[:2] if len(sorted_experiences) >= 2 else sorted_experiences)
            sorted_experiences = sorted_experiences[2:] if len(sorted_experiences) >= 2 else []

            if len(sorted_experiences) > 0:
                sorted_experiences.sort(key=lambda x: calculate_experience_duration(x[1]), reverse=True)

                # Calculate the total experience duration
                total_duration = sum(calculate_experience_duration(experience) for _, experience in final_experiences)

                if float(years_of_experience) - total_duration > 0.7:
                    final_experiences.extend([sorted_experiences[0]])
                
            
            latex_content = handle_experience(latex_content, final_experiences, keywords, jobdescription, os.path.join(template_dir, "experience.tex"))

        # Handle Projects
        elif pattern == 'projects':
            project_scores = []
            for project in data['projects']:
                score = getRelevanceScore(jobdescription, str(project))
                project_scores.append((score, project))

            # Sort the filtered projects by score in descending order
            sorted_projects = sorted(project_scores, key=lambda x: x[0], reverse=True)

            # Select at most two projects
            selected_projects = sorted_projects[:2] if len(sorted_projects) >= 2 else sorted_projects

            # Define how much space is remaining
            space = useMoreSpace - useLessSpace

            # Assign Points Based on the space available
            # NOTE: Removed fake project generation - only use user's actual projects
            points_count = []
            if space > 0:
                # Select up to 3 real projects if available
                selected_projects = sorted_projects[:3] if len(sorted_projects) >= 3 else sorted_projects
                points_count = [3, 1 + space, 1 + space][:len(selected_projects)]
            
            elif space == 0:
                points_count = [3, 3]
            
            elif space == -1:
                points_count = [2, 2]

            elif space == -2:
                selected_projects = selected_projects[:1]
                points_count = [2]
            # Sort the projects again based on their scores
            selected_projects.sort(key=lambda x: x[0], reverse=True)

            # Generate The Latex
            latex_content = handle_projects(latex_content, selected_projects, points_count, jobdescription, keywords, os.path.join(template_dir, "projects.tex"))

    return latex_content

    

# Compile LaTeX to PDF
# Function to compile a LaTeX document into a PDF
def compile_pdf(main_tex_path: str, output_dir: str) -> int:
    """Compile LaTeX to PDF and return the actual page count (default 1 on parse failure)."""
    try:
        # Ensure the output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Run latexmk to compile LaTeX into PDF
        result = subprocess.run(
            ["latexmk", "-pdf", "-interaction=nonstopmode", "-output-directory=" + output_dir, main_tex_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        print("✅ LaTeX compilation successful!")

        # Parse page count from .log before cleanup
        base_name = os.path.splitext(os.path.basename(main_tex_path))[0]
        log_path = os.path.join(output_dir, base_name + ".log")
        actual_pages = 1
        if os.path.exists(log_path):
            with open(log_path) as lf:
                for line in lf:
                    m = re.search(r'Output written on .+ \((\d+) pages?,', line)
                    if m:
                        actual_pages = int(m.group(1))
                        break

        # Clean up auxiliary files, keep only .tex and .pdf
        aux_extensions = {".aux", ".log", ".fls", ".fdb_latexmk", ".synctex.gz", ".out", ".toc"}
        for f in os.listdir(output_dir):
            if os.path.splitext(f)[1] in aux_extensions:
                os.remove(os.path.join(output_dir, f))

        return actual_pages

    except subprocess.CalledProcessError as e:
        stdout = e.stdout.decode() if e.stdout else ""
        stderr = e.stderr.decode() if e.stderr else ""
        # Extract the actual LaTeX error lines (lines starting with !)
        error_lines = [l for l in stdout.split("\n") if l.startswith("!") or "Error" in l or "error" in l]
        print(f"❌ LaTeX error:\n" + "\n".join(error_lines[:20]) if error_lines else stdout[-2000:])
        print(f"❌ stderr: {stderr[-500:]}")
        raise RuntimeError("LaTeX compilation failed!")
