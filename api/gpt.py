import os
from openai import OpenAI
from dotenv import load_dotenv
from collections import defaultdict

subskilldict = defaultdict(list, {
    "software": ["Technologies", "Languages", "Libraries", "Tools", "Databases"],
    "ai": ["Machine Learning", "Languages", "Technologies", "Databases", ],
    "data": ["Data Analysis", "Data Visualization", "Tools", "Database", "Statistical Techniques"],
    "management": ["Strategic Planning", "Project Management", "Budgeting Techniques", "Soft Skills"],
    "engineering": ["Technical Skills, Soft Skills, Management Skills, Other Skills"],
    "sales": ["Negotiation Strategies", "Lead Generation Techniques", "Closing Techniques", "Customer Relationship Management Software", "Sales Analytics"],
    "research": ["Data Collection Methods", "Statistical Analysis Software", "Data Visualization Tools", "Experimental Design", "Literature Review Techniques"],
    "other": ["Communication", "Problem-Solving", "Time Management", "Adaptability", "Creativity"]
})


load_dotenv()  # Load environment variables from a .env file

client = OpenAI(
    api_key=os.getenv("OPENAI_KEY"),  # This is the default and can be omitted
)

def getKeyWords(jobdescription: str) -> list:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": f"Extract the 20 most important key words from the following job description and return them as a comma-separated list: {jobdescription}"}
        ]
    )
    keywords = response.choices[0].message.content.strip()
    return keywords.split(", ")

def getJobField(jobdescription: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": f"Classify the following job description into one of the following fields in one word: software, ai, engineering, management, sales, or other. Job description: {jobdescription}"}
        ]
    )
    job_field = response.choices[0].message.content.strip()
    return job_field

def getSkills(jobdescription: str, skills: str) -> dict:
    field = getJobField(jobdescription)
    subskills = subskilldict[field]
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", "content": f"Consider these job description: {jobdescription}. Consider these skills: {skills} as skills1. Now consider all the skills used by the companies for this positions as skills2.  Organize the skills1 and skills2 into four subsections: {subskills}. Provide a concise output in the format <Subskill>:<skills> (comma-separated). I need exactly {len(subskills)} lines, one for each subskill, with no extra words. Include all the skills which are even remotely related exclude only if it is extremely irrelevant."}
        ]
    )
    skills_content = response.choices[0].message.content.strip()
    return skills_content

def getRelevanceScore(jobdescription: str, experience_or_project: str) -> int:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "user",
                "content": (
                    "You are an expert in evaluating job descriptions and matching experiences to job requirements. "
                    "Assess the relevance of the following experience or project to the provided job description, focusing on key skills, responsibilities, and outcomes. "
                    "Rate it on a scale from 0 to 100, where 0 means not relevant at all and 100 means highly relevant. "
                    "Consider the alignment of the experience or project with the skills, technologies, and responsibilities highlighted in the job description. But don't just consider that, also consider the innovative approach and cool projects"
                    f"Job description: {jobdescription}. Experience/Project: {experience_or_project}. "
                    "Provide only a number between 0 - 100 as output nothing else."
                )
            }]
    )
    score = response.choices[0].message.content.strip()
    return int(score)

def extractExperienceAndSkills(jobdescription: str) -> dict:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "user", 
             "content": f"""From the following job description, extract the required years of experience, relevant skills, and top 20 keywords. Job description: {jobdescription}.
                            The output should be of format and nothing extra:
                            Years of Experience: <a single integer value nothing else>
                            Skills: <a comma seperated list of skills>
                            Keywords: <a comma seperated list of top 20 keywords>

                            The output should be just these three lines and nothing else
                        """
            }
        ]
    )
    extracted_info = response.choices[0].message.content.strip()
    
    years_of_experience, relevant_skills, keywords = map(lambda x: x.split(":")[1].strip(), extracted_info.split("\n")[:3])
    years_of_experience = int(years_of_experience)
    relevant_skills = relevant_skills.split(", ")
    keywords = keywords.split(", ")
    return years_of_experience, relevant_skills, keywords

def generatePoints(data, typestr, jobdescription, keywords, points_count):
    desc = data["description"]
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Generate {points_count} highly relevant and impactful bullet points for the following {typestr}, "
                    f"aligning closely with the job description: {jobdescription}. Jobdescription is just to help your with what keywords and technologies to add."
                    f"{typestr} details: {desc}.\n\n THIS IS IMPORTANT, USE THESE DETAILS TO MAKE POINTS, PARAPHRASE THIS TO MATCH THE JD"
                    "Extract and emphasize the most relevant experiences, ensuring each point demonstrates a direct connection "
                    "to the job's expectations. Use precise, non-generic language that makes the contribution and its impact clear. "
                    "Avoid fluff and overused action verbs like ‘spearheaded’ or ‘orchestrated or enhanced or developed or designed.’ \n\n"
                    "- Prioritize measurable outcomes, unique problem-solving approaches, and real-world results.\n"
                    "- Integrate the following keywords naturally: " + ", ".join(keywords) + ".\n" + " Don't force it just use it if it aligns with the details"
                    "- Avoid jargon that lacks context—explain the impact in a way that is easy to grasp.\n"
                    "- Use clear, concise, and strong phrasing that highlights skills applied and challenges overcome.\n"
                    "- Each point should be one concise sentence, occasionally two if necessary.\n\n"
                    "Example before generating the points:\n"
                    "- Instead of ‘Spearheaded a data pipeline migration,’ say: ‘Reduced query latency by 40% by optimizing the data pipeline for real-time analytics.’\n"
                    "- Instead of ‘Engineered a recommendation model,’ say: ‘Built a personalized recommendation system that increased user engagement by 25%.’\n\n"
                    f"Just give me {points_count} bullet points, nothing extra."
                )
            }
        ]
    )
    
    generated_points = response.choices[0].message.content.strip().split("\n")
    generated_points = [point.lstrip('- ').strip() for point in generated_points]  # Strip hyphen and whitespace from each point
    generated_points = [point for point in generated_points if point != ""]  # Remove any empty strings
    return generated_points  # Return only the required number of points

def generateProject(jobdescription):
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Generate a project name (1-3 words), a short description (5-7 words), and a detailed description (100 words) based on the following job description: {jobdescription}. "
                    "Ensure the project name is catchy and relevant, and perfectly aligns with the job description. The short description should summarize the project succinctly, and the detailed description must provide a comprehensive overview of the project's objectives, methodologies, and expected outcomes. "
                    "Make sure to include the technologies and keywords from the job description. "
                    """The output should be 3 lines and nothing extra:
                        Name: <Name in 1-3 words>
                        Title: <Title in 5-7 words>
                        Description: <Description in about 100 words>
                    """
                )
            }
        ]
    )
    
    project_info = response.choices[0].message.content.strip().split("\n")
    project_info = [line for line in project_info if line.strip() != ""]

    project_name = project_info[0].replace("Name:", "").strip()
    short_description = project_info[1].replace("Title:", "").strip()
    detailed_description = project_info[2].replace("Description:", "").strip()
    
    return project_name, short_description, detailed_description