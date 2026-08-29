import pytorch_lightning as pl
import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from models.hybrid_llm import HybridQuantumLLM
from scipy.stats import pearsonr, spearmanr
import numpy as np

class HybridLightningModule(pl.LightningModule):
    def __init__(self, config):
        super().__init__()
        self.save_hyperparameters()
        self.config = config
        self.model = HybridQuantumLLM(config)
        self.loss_fn = nn.MSELoss() # Assuming STS-B for default

    def forward(self, input_ids, attention_mask):
        return self.model(input_ids, attention_mask)

    def training_step(self, batch, batch_idx):
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['label'].float()
        
        preds = self(input_ids, attention_mask).squeeze(-1)
        loss = self.loss_fn(preds, labels)
        
        self.log('train_loss', loss, prog_bar=True)
        return loss

    def validation_step(self, batch, batch_idx):
        input_ids = batch['input_ids']
        attention_mask = batch['attention_mask']
        labels = batch['label'].float()
        
        preds = self(input_ids, attention_mask).squeeze(-1)
        loss = self.loss_fn(preds, labels)
        
        self.log('val_loss', loss, prog_bar=True)
        return {"preds": preds.detach().cpu(), "labels": labels.detach().cpu()}

    def on_validation_epoch_end(self):
        # We need to collect all outputs to compute pearson/spearman
        # In a real distributed setting, we'd gather across devices
        pass

    def configure_optimizers(self):
        optimizer = AdamW(self.parameters(), lr=self.config.training.learning_rate)
        scheduler = CosineAnnealingLR(optimizer, T_max=self.config.training.max_epochs)
        return [optimizer], [scheduler]
