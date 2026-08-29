import torch
import torch.nn as nn
from transformers import AutoModel, AutoConfig

class TransformerBackbone(nn.Module):
    def __init__(self, model_name_or_path: str = "all-MiniLM-L6-v2"):
        super().__init__()
        self.model = AutoModel.from_pretrained(model_name_or_path)
        self.config = AutoConfig.from_pretrained(model_name_or_path)
        self.hidden_size = self.config.hidden_size

        # Enable gradient checkpointing for memory optimization
        if hasattr(self.config, 'gradient_checkpointing'):
            self.model.gradient_checkpointing_enable()

    def forward(self, input_ids, attention_mask):
        outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
        # Use mean pooling for sentence representation
        token_embeddings = outputs.last_hidden_state
        input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
        embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)
        return embeddings

class DimensionReduction(nn.Module):
    def __init__(self, input_dim: int, output_dim: int):
        super().__init__()
        # Cascading dimension reduction as proposed in the advanced architecture
        # e.g., 768 -> 256 -> 64 -> 16 -> 8 -> 4 -> 2^n
        layers = []
        current_dim = input_dim
        
        while current_dim > output_dim * 4:
            next_dim = max(current_dim // 4, output_dim)
            layers.append(nn.Linear(current_dim, next_dim))
            layers.append(nn.GELU())
            layers.append(nn.LayerNorm(next_dim))
            current_dim = next_dim
            
        layers.append(nn.Linear(current_dim, output_dim))
        
        self.reduction_net = nn.Sequential(*layers)

    def forward(self, x):
        return self.reduction_net(x)
