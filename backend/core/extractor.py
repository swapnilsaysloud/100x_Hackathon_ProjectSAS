class FeatureExtractor:
    def __init__(self):
        pass

    def extract(self, candidate: dict, job: dict) -> dict:
        skill_overlap = len(set(candidate.get("skills", [])) & set(job.get("skills", [])))
        experience_gap = abs(candidate.get("experience", 0) - job.get("experience", 0))
        qualification_match = int(bool(set(candidate.get("qualifications", [])) & set(job.get("qualifications", []))))

        return {
            "skill_overlap": skill_overlap,
            "experience_gap": experience_gap,
            "qualification_match": qualification_match,
        }

    def to_vector(self, feature_dict: dict) -> list:
        return [
            feature_dict["skill_overlap"],
            feature_dict["experience_gap"],
            feature_dict["qualification_match"],
        ]
