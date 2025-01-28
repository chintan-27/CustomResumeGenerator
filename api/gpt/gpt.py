import os
from openai import OpenAI
from gpt import default_skills_dict as subskilldict
from dotenv import load_dotenv

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
             "content": f"""From the following job description, extract the required years of experience and relevant skills. Job description: {jobdescription}.
                            The output should be of format and nothing extra:
                            Years of Experience: <a single integer value nothing else>
                            Skills: <a comma seperated list of skills>
                            Keywords: <a comma seperated list of keywords>

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
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": (
                    f"Craft {str(points_count)} compelling and impactful bullet points for the following {typestr}, tailored to the job description provided: {jobdescription}. "
                    f"{typestr} details: {data['description']}. "
                    f"From the {typestr} information try to include whatever that is cool and very highly matches the job description. "
                    f"Try to include these keywords: {', '.join(keywords)}.  "
                    "Emphasize measurable achievements, advanced skills applied, and outcomes that align with the job's responsibilities and expectations. Don't use the exact information but rephrase it well. "
                    "Each point should begin with a powerful action verb and maintain a results-driven focus, adhering to the standards of top-tier institutions like Stanford and Harvard. "
                    "Ensure each point is concise, professional, and quantifiable. "
                    f"Just give me {points_count} lines and nothing extra. Make the points very concise"
                )
            }
        ]
    )
    
    generated_points = response.choices[0].message.content.strip().split("\n")
    generated_points = [point.lstrip('- ').strip() for point in generated_points]  # Strip hyphen and whitespace from each point
    generated_points = [point for point in generated_points if point != ""]  # Remove any empty strings
    return generated_points  # Return only the required number of points