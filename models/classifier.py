import torch.nn as nn

class PredictionHead(nn.Module):
    def __init__(self, input_dim: int, num_classes: int = 1, task_type: str = "regression"):
        super().__init__()
        self.task_type = task_type
        self.num_classes = num_classes
        
        layers = [
            nn.Linear(input_dim, input_dim // 2),
            nn.GELU(),
            nn.Dropout(0.1),
            nn.Linear(input_dim // 2, num_classes)
        ]
        self.classifier = nn.Sequential(*layers)

    def forward(self, x):
        return self.classifier(x)
