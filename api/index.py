from flask import Flask, request, jsonify, send_file
import yaml
import openai
import os
import subprocess
from flask_cors import CORS

from gpt.gpt import getSkills, getRelevanceScore
from resumeMaker.resumeMaker import load_yaml, read_latex, make_latex_resume, write_latex, compile_pdf

# app = Flask(__name__)
# CORS(app)


if __name__ == "__main__":
    # File paths
    yaml_file = "resume.yaml"
    template_dir = "templates/template1"
    main_tex_file = os.path.join(template_dir, "main.tex")
    output_tex_file = "output/output.tex"
    output_directory = "output"
    with open("input.txt", "r") as file:
        job_description = file.read()

    # Load YAML data
    yaml_data = load_yaml(file_path=yaml_file)
    experience_scores = []
    project_scores = []

    for experience in yaml_data.get('experience', []):
        score = getRelevanceScore(job_description, str(experience))
        experience_scores.append({'position': experience['position'], 'company': experience['company'], 'score': score})

    for project in yaml_data.get('projects', []):
        score = getRelevanceScore(job_description, f"{project['name']}: {project['details']}. {project['description']}")
        project_scores.append({'title': project['name'], 'score': score})

    print("Experience Scores:", experience_scores)
    print("Project Scores:", project_scores)

    # Read LaTeX template
    # latex_template = read_latex(file_path=main_tex_file)

    # # Replace placeholders with YAML values
    # populated_content = make_latex_resume(latex_content=latex_template, data=yaml_data, jobdescription=job_description, template_dir=template_dir)

    # # Write populated LaTeX to a new file
    # write_latex(file_path=output_tex_file, content=populated_content)

    # # Compile the LaTeX file to PDF
    # compile_pdf(main_tex_path=output_tex_file, output_dir=output_directory)

    # # app.run(debug=True)
