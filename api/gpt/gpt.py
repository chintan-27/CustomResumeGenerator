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
