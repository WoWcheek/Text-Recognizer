import os
import json
import torch
from datasets import Dataset, load_metric
from transformers import AutoModelForSequenceClassification, Trainer, TrainingArguments, AutoTokenizer
from datetime import datetime
import logging

DATASET_PATH = "src/utils/feedback_dataset_*.json"  
MODEL_NAME = "cardiffnlp/twitter-xlm-roberta-base-sentiment"
OUTPUT_DIR = "models/custom-sentiment/"

logging.basicConfig(
filename='training_log.txt',
level=logging.INFO,
format='%(asctime)s:%(levelname)s:%(message)s'
)

try:


    def load_feedback_dataset():
        feedback_files = sorted([f for f in os.listdir("src/utils") if f.startswith("feedback_dataset_")], reverse=True)
        if not feedback_files:
            raise Exception("Не знайдено жодного файлу датасету!")

        dataset_path = os.path.join("src/utils", feedback_files[0])
        print(f"\ud83d\udcc5 Завантажуємо датасет: {dataset_path}")

        with open(dataset_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return Dataset.from_list(data)

    def tokenize_function(examples):
        return tokenizer(examples["text"], truncation=True)

    if __name__ == "__main__":
        raw_dataset = load_feedback_dataset()
        raw_dataset = raw_dataset.train_test_split(test_size=0.2)

        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=3)

        label2id = {"negative": 0, "neutral": 1, "positive": 2}
        id2label = {0: "negative", 1: "neutral", 2: "positive"}
        model.config.label2id = label2id
        model.config.id2label = id2label

        tokenized_datasets = raw_dataset.map(tokenize_function, batched=True)

        training_args = TrainingArguments(
            output_dir=OUTPUT_DIR,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            logging_strategy="epoch",
            num_train_epochs=5,
            per_device_train_batch_size=8,
            per_device_eval_batch_size=8,
            warmup_steps=50,
            weight_decay=0.01,
            save_total_limit=2,
            load_best_model_at_end=True,
            metric_for_best_model="accuracy",
            greater_is_better=True,
        )

        metric = load_metric("accuracy")

        def compute_metrics(p):
            preds = p.predictions.argmax(-1)
            return metric.compute(predictions=preds, references=p.label_ids)

        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=tokenized_datasets["train"],
            eval_dataset=tokenized_datasets["test"],
            compute_metrics=compute_metrics,
        )

        
        trainer.train()

        model_save_path = os.path.join(OUTPUT_DIR, f"model_{datetime.now().strftime('%Y%m%d_%H%M%S')}")
        model.save_pretrained(model_save_path)
        tokenizer.save_pretrained(model_save_path)

        print(f"\u2705 Нова модель збережена у {model_save_path}")
    
        logging.info("Навчання успішно завершено.")

except Exception as e:
    logging.error(f"Помилка під час навчання: {str(e)}")
