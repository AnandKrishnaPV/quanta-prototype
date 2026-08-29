import pytorch_lightning as pl
from torch.utils.data import DataLoader
from datasets import load_dataset
from transformers import AutoTokenizer
import torch

class STSBDataModule(pl.LightningDataModule):
    def __init__(self, model_name_or_path: str, batch_size: int = 32, max_length: int = 128):
        super().__init__()
        self.model_name_or_path = model_name_or_path
        self.batch_size = batch_size
        self.max_length = max_length
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name_or_path)

    def prepare_data(self):
        load_dataset("nyu-mll/glue", "stsb")

    def setup(self, stage=None):
        self.dataset = load_dataset("nyu-mll/glue", "stsb")
        
        # Tokenize dataset
        self.tokenized_datasets = self.dataset.map(
            self.tokenize_function,
            batched=True,
            remove_columns=['sentence1', 'sentence2', 'idx']
        )
        self.tokenized_datasets.set_format("torch")

    def tokenize_function(self, examples):
        return self.tokenizer(
            examples["sentence1"],
            examples["sentence2"],
            padding="max_length",
            truncation=True,
            max_length=self.max_length
        )

    def train_dataloader(self):
        return DataLoader(self.tokenized_datasets["train"], batch_size=self.batch_size, shuffle=True)

    def val_dataloader(self):
        return DataLoader(self.tokenized_datasets["validation"], batch_size=self.batch_size)

    def test_dataloader(self):
        return DataLoader(self.tokenized_datasets["test"], batch_size=self.batch_size)

class NLIDataModule(pl.LightningDataModule):
    def __init__(self, model_name_or_path: str, batch_size: int = 32, max_length: int = 128):
        super().__init__()
        self.model_name_or_path = model_name_or_path
        self.batch_size = batch_size
        self.max_length = max_length
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name_or_path)

    def prepare_data(self):
        load_dataset("stanfordnlp/snli")

    def setup(self, stage=None):
        self.dataset = load_dataset("stanfordnlp/snli")
        # filter out invalid labels (-1)
        self.dataset = self.dataset.filter(lambda example: example['label'] != -1)
        
        self.tokenized_datasets = self.dataset.map(
            self.tokenize_function,
            batched=True,
            remove_columns=['premise', 'hypothesis']
        )
        self.tokenized_datasets.set_format("torch")

    def tokenize_function(self, examples):
        return self.tokenizer(
            examples["premise"],
            examples["hypothesis"],
            padding="max_length",
            truncation=True,
            max_length=self.max_length
        )

    def train_dataloader(self):
        return DataLoader(self.tokenized_datasets["train"], batch_size=self.batch_size, shuffle=True)

    def val_dataloader(self):
        return DataLoader(self.tokenized_datasets["validation"], batch_size=self.batch_size)

    def test_dataloader(self):
        return DataLoader(self.tokenized_datasets["test"], batch_size=self.batch_size)

