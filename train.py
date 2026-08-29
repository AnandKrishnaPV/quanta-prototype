import hydra
from omegaconf import DictConfig, OmegaConf
import pytorch_lightning as pl
from pytorch_lightning.callbacks import ModelCheckpoint, EarlyStopping
from pytorch_lightning.loggers import TensorBoardLogger
import os
import sys
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from data_modules.data_module import STSBDataModule
from training.lightning_module import HybridLightningModule

@hydra.main(version_base="1.3", config_path="configs", config_name="config")
def main(cfg: DictConfig):
    print(OmegaConf.to_yaml(cfg))
    pl.seed_everything(cfg.seed)
    
    # Init DataModule
    data_module = STSBDataModule(
        model_name_or_path=cfg.model.backbone,
        batch_size=cfg.training.batch_size
    )
    
    # Init Lightning Module
    model = HybridLightningModule(cfg)
    
    # Optional: Optimize via torch.compile for PyTorch 2.0+
    if getattr(cfg.training, "compile", False):
        import torch
        model = torch.compile(model)
    
    # Callbacks
    checkpoint_callback = ModelCheckpoint(
        dirpath="checkpoints",
        filename="hybrid-{epoch:02d}-{val_loss:.2f}",
        save_top_k=3,
        monitor="val_loss",
        mode="min"
    )
    early_stop_callback = EarlyStopping(
        monitor="val_loss",
        patience=cfg.training.patience,
        mode="min"
    )
    
    # Logger
    logger = TensorBoardLogger("logs", name=cfg.experiment_name)
    
    # Trainer
    trainer = pl.Trainer(
        max_epochs=cfg.training.max_epochs,
        callbacks=[checkpoint_callback, early_stop_callback],
        logger=logger,
        accelerator="cpu",
        devices="auto",
        accumulate_grad_batches=cfg.training.accumulate_grad_batches,
        precision=cfg.training.precision,
        gradient_clip_val=cfg.training.gradient_clip_val,
        fast_dev_run=True # Set to True for testing the prototype implementation
    )
    
    # Train
    trainer.fit(model, datamodule=data_module)
    
    # Return metrics for the orchestrator
    return trainer.callback_metrics

if __name__ == "__main__":
    main()
