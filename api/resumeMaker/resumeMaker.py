import yaml
import re
from jinja2 import Template
import subprocess
import os
from gpt.gpt import getSkills

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
    for education in data:
        education_latex = education_latex_og.split("-----")[0]
        extracted_patterns = list(set(extract_patterns(education_latex)))
        for pattern in extracted_patterns:
            if pattern != "duration":
                education_latex = education_latex.replace(f"xyz{pattern}xyz", education[pattern])
            else:
                duration = f"{education['startmonth'][:3]} {education['startyear']} - {education['endmonth'][:3]} {education['endyear']}"
                education_latex = education_latex.replace("xyzdurationxyz", duration)
        final_education_latex.append(education_latex)

    inbetween_latex = education_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_education_latex = inbetween_latex.join(final_education_latex)
    latex_content = latex_content.replace("xyzeducationxyz", final_education_latex)
    return latex_content

# Handle Experience
def handle_experience(latex_content, data, experience_latex_file):
    experience_latex_og = read_latex(experience_latex_file)
    final_experience_latex = []
    for experience in data:
        experience_latex = experience_latex_og.split("-----")[0]
        extracted_patterns = list(set(extract_patterns(experience_latex)))
        for pattern in extracted_patterns:
            if pattern == "duration":
                duration = f"{experience['startmonth'][:3]} {experience['startyear']} - {experience['endmonth'][:3]} {experience['endyear']}" if experience['endmonth'] and experience['endyear'] else f"{experience['startmonth'][:3]} {experience['startyear']} - Present"
                experience_latex = experience_latex.replace("xyzdurationxyz", duration)
            elif pattern != "points":
                experience_latex = experience_latex.replace(f"xyz{pattern}xyz", experience[pattern])
            else:
                points = "\n".join([r"\item " + point.replace('%', r'\%').replace('$', r'\$') for point in experience['points']]) if experience['points'] else r"\item No points available."
                experience_latex = experience_latex.replace("xyzpointsxyz", points)
        final_experience_latex.append(experience_latex)

    inbetween_latex = experience_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_experience_latex = inbetween_latex.join(final_experience_latex)
    latex_content = latex_content.replace("xyzexperiencexyz", final_experience_latex)
    return latex_content

# Handle Projects
def handle_projects(latex_content, data, projects_latex_file):
    projects_latex_og = read_latex(projects_latex_file)
    final_projects_latex = []
    for project in data:
        project_latex = projects_latex_og.split("-----")[0]
        extracted_patterns = list(set(extract_patterns(project_latex)))
        for pattern in extracted_patterns:
            if pattern == "points":
                points = "\n".join([r"\item " + point.replace('%', r'\%').replace('$', r'\$') for point in project['points']]) if project['points'] else r"\item No points available."
                project_latex = project_latex.replace("xyzpointsxyz", points)
            else:
                project_latex = project_latex.replace(f"xyz{pattern}xyz", project[pattern])
        final_projects_latex.append(project_latex)

    inbetween_latex = projects_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_projects_latex = inbetween_latex.join(final_projects_latex)
    latex_content = latex_content.replace("xyzprojectsxyz", final_projects_latex)
    return latex_content

# TODO: Calculate relevance scores for experiences, project and achievements/certifications
# TODO: Start with experience - select the current and two with the highest score, check the requirements for YOE, if it's not fulfilled greedily select the longest
#       one and only if extremely necessary, select one more
# TODO: if more than 3 selected set flag - use less space for projects and achievements/certifications if less than 3 selected set - use more space for projects and achievements
# TODO: For the most relevant one generate 4 very very relevant points and for next 2 generate 3 and for the rest just one point
# TODO: Select 3 with highest relevance, if all the relevance score is less than 60 generate one and select that and 2 most relevant
# TODO: Case 1 -use less space flag is set, generate 2 points for most relevant and 1 each for the rest 2, Case 2: if -use more space is set, 4 for 1st and 2 for rest, 
# TODO: Case 3: none are set generate 3 for 1st , 2 for 2nd and 1 for 3rd.
# TODO: Check Achievement score if its is more than 80 then only add otherwise avoid. For Case 1 - just one line, For case 2 and 3, 2 lines

# Replace placeholders with YAML values
def make_latex_resume(latex_content, data, jobdescription ,template_dir):
    extracted_patterns = list(set(extract_patterns(latex_content)))
    for pattern in extracted_patterns:
        if pattern not in ['experience', 'education', 'projects', 'skills']:
            latex_content = latex_content.replace(f"xyz{pattern}xyz", data[pattern])
        elif pattern == "skills":
            skills = getSkills(jobdescription, data["skills"]).split("\n")
            skills_latex = []
            for skill in skills:
                skills_latex.append(f"\\item {skill}")
            latex_content = latex_content.replace("xyzskillsxyz", "\n".join(skills_latex))
        elif pattern == 'education':
            latex_content = handle_education(latex_content, data['education'], os.path.join(template_dir, "education.tex"))
        # elif pattern == 'experience':
        #     latex_content = handle_experience(latex_content, data['experience'], os.path.join(template_dir, "experience.tex"))
        # elif pattern == 'projects':
        #     latex_content = handle_projects(latex_content, data['projects'], os.path.join(template_dir, "projects.tex"))
    return latex_content

    

# Compile LaTeX to PDF
def compile_pdf(main_tex_path, output_dir):
    try:
        subprocess.run(["pdflatex", "-interaction=nonstopmode", "-output-directory", output_dir, main_tex_path], check=True)
        print("PDF compiled successfully.")
    except subprocess.CalledProcessError as e:
        print("Error during PDF compilation:", e)
