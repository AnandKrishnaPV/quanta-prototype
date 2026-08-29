import pytorch_lightning as pl
from torch.utils.data import DataLoader
from datasets import load_dataset
from transformers import AutoTokenizer

class GLUEDataModule(pl.LightningDataModule):
    def __init__(self, model_name_or_path: str, task_name: str = "stsb", batch_size: int = 32, max_length: int = 128):
        super().__init__()
        self.model_name_or_path = model_name_or_path
        self.task_name = task_name
        self.batch_size = batch_size
        self.max_length = max_length
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name_or_path)

        # Mapping task names to dataset features
        self.task_text_fields = {
            "stsb": ("sentence1", "sentence2"),
            "snli": ("premise", "hypothesis"),
            "mnli": ("premise", "hypothesis"),
            "mrpc": ("sentence1", "sentence2"),
            "qqp": ("question1", "question2"),
            "paws": ("sentence1", "sentence2"),
            "sick": ("sentence_A", "sentence_B")
        }

    def prepare_data(self):
        if self.task_name in ["snli", "paws", "sick"]:
            load_dataset(self.task_name)
        else:
            load_dataset("glue", self.task_name)

    def setup(self, stage=None):
        if self.task_name in ["snli", "paws", "sick"]:
            self.dataset = load_dataset(self.task_name)
        else:
            self.dataset = load_dataset("glue", self.task_name)

        # Remove invalid samples if SNLI
        if self.task_name == "snli":
            self.dataset = self.dataset.filter(lambda example: example['label'] != -1)

        text_fields = self.task_text_fields[self.task_name]
        
        self.tokenized_datasets = self.dataset.map(
            lambda examples: self.tokenizer(
                examples[text_fields[0]],
                examples[text_fields[1]],
                padding="max_length",
                truncation=True,
                max_length=self.max_length
            ),
            batched=True,
            remove_columns=list(text_fields) + (['idx'] if 'idx' in self.dataset['train'].column_names else [])
        )
        self.tokenized_datasets.set_format("torch")

    def train_dataloader(self):
        return DataLoader(self.tokenized_datasets["train"], batch_size=self.batch_size, shuffle=True)

    def val_dataloader(self):
        validation_split = "validation_mismatched" if self.task_name == "mnli" else "validation"
        return DataLoader(self.tokenized_datasets[validation_split], batch_size=self.batch_size)

    def test_dataloader(self):
        test_split = "test_mismatched" if self.task_name == "mnli" else "test"
        if test_split in self.tokenized_datasets:
            return DataLoader(self.tokenized_datasets[test_split], batch_size=self.batch_size)
        return None
