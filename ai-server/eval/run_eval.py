import argparse
import json
import os
from typing import List, Dict

import httpx


def normalize(text: str) -> str:
    return "".join(text.lower().split())


def score_answer(answer: str, keywords: List[str]) -> bool:
    if not keywords:
        return False
    normalized_answer = normalize(answer)
    return all(normalize(keyword) in normalized_answer for keyword in keywords)


def run_eval(api_base: str, dataset_path: str, mode: str, limit: int | None) -> Dict[str, int]:
    with open(dataset_path, "r", encoding="utf-8") as file:
        dataset = json.load(file)

    total = 0
    passed = 0

    with httpx.Client(timeout=60.0) as client:
        for sample in dataset[: limit or len(dataset)]:
            question = sample.get("question", "")
            keywords = sample.get("expected_keywords", [])

            response = client.post(
                f"{api_base}/api/chat",
                json={"message": question, "mode": mode, "context": "", "user_role": "staff"},
            )
            response.raise_for_status()
            data = response.json()
            answer = data.get("reply", "")

            total += 1
            if score_answer(answer, keywords):
                passed += 1
            else:
                print(f"[FAIL] {sample.get('id')} -> {question}")
                print(f"Expected keywords: {keywords}")
                print(f"Answer: {answer}\n")

    return {"total": total, "passed": passed}


def main() -> None:
    parser = argparse.ArgumentParser(description="Run golden dataset evaluation.")
    parser.add_argument("--dataset", default="golden_legal.json", help="Dataset filename in eval folder")
    parser.add_argument("--api", default=os.getenv("EVAL_API_BASE_URL", "http://localhost:4000"))
    parser.add_argument("--mode", default=os.getenv("EVAL_MODE", "legal"))
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()

    dataset_path = args.dataset
    if not os.path.isabs(dataset_path):
        dataset_path = os.path.join(os.path.dirname(__file__), dataset_path)

    result = run_eval(args.api, dataset_path, args.mode, args.limit)
    pass_rate = (result["passed"] / result["total"]) * 100 if result["total"] else 0
    print(f"Passed {result['passed']} / {result['total']} ({pass_rate:.1f}%)")


if __name__ == "__main__":
    main()
