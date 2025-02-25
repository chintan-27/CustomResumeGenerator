import yaml
import re
from jinja2 import Template
import subprocess
import os
from gpt import extractExperienceAndSkills, getRelevanceScore, getSkills, generatePoints, generateProject
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
                education_latex = education_latex.replace(f"xyz{pattern}xyz", education[pattern])
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
        end_date = datetime.strptime(f"{experience['endmonth']} {experience['endyear']}", "%m %Y")

    start_date = datetime.strptime(f"{experience['startmonth']} {experience['startyear']}", "%m %Y")
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
                experience_latex = experience_latex.replace(f"xyz{pattern}xyz", experience[pattern])
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
                project_latex = project_latex.replace(f"xyz{pattern}xyz", project[pattern])
        final_projects_latex.append(project_latex)

    inbetween_latex = projects_latex_og.split("-----")[1].split(":")[1].strip() + "\n"
    final_projects_latex = inbetween_latex.join(final_projects_latex)
    latex_content = latex_content.replace("xyzprojectsxyz", final_projects_latex)
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
            latex_content = latex_content.replace(f"xyz{pattern}xyz", data[pattern])

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

            # Assign Points Based on the space available and generate extra project is necessary
            points_count = []
            if space > 0:
                if len(sorted_projects) < 3 or selected_projects[0][0] < 100:
                    name, details, description = generateProject(jobdescription)
                    generated_project = {"name": name, "details": details, "description": description}
                    genscore = getRelevanceScore(jobdescription, str(generated_project))
                    selected_projects.append((genscore, generated_project))

                else:
                    selected_projects = sorted_projects[:3]
                
                points_count = [3, 1 + space, 1 + space]
            
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
def compile_pdf(main_tex_path: str, output_dir: str):
    try:
        # Ensure the output directory exists
        os.makedirs(output_dir, exist_ok=True)

        # Run latexmk to compile LaTeX into PDF
        subprocess.run(
            ["latexmk", "-pdf", "-interaction=nonstopmode", "-output-directory=" + output_dir, main_tex_path],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        print("✅ LaTeX compilation successful!")

    except subprocess.CalledProcessError as e:
        print(f"❌ Error compiling LaTeX: {e.stderr.decode()}")
        raise RuntimeError("LaTeX compilation failed!")
