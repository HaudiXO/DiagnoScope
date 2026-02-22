import json
import logging
from datetime import datetime, timedelta

import requests
from airflow import DAG
from airflow.operators.python import PythonOperator

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
}


def invoke_api_and_diagnose(**kwargs):
    dag_run = kwargs.get("dag_run")
    patient_id = "default_patient"
    symptoms = "У пациента сильная головная боль, температура 39, ломота в суставах."

    if dag_run and dag_run.conf:
        patient_id = dag_run.conf.get("patient_id", patient_id)
        symptoms = dag_run.conf.get("symptoms", symptoms)

    payload = {"patient_id": patient_id, "symptoms": symptoms}

    logging.info(f"Sending request to API for patient {patient_id}")
    try:
        response = requests.post("http://api:8000/diagnose", json=payload, timeout=300)
        response.raise_for_status()
        result = response.json()
        logging.info(
            f"Successfully received diagnosis: {json.dumps(result, ensure_ascii=False)}"
        )
        return result
    except requests.exceptions.RequestException as e:
        logging.error(f"Error calling diagnosis API: {e}")
        raise


with DAG(
    "patient_diagnosis_pipeline",
    default_args=default_args,
    description="Pipeline to process patient symptoms and get diagnosis via LangChain API",
    schedule_interval=None,
    start_date=datetime(2026, 1, 1),
    catchup=False,
    tags=["medical", "diagnosis", "llm"],
) as dag:
    diagnose_task = PythonOperator(
        task_id="invoke_langchain_api",
        python_callable=invoke_api_and_diagnose,
        provide_context=True,
    )
