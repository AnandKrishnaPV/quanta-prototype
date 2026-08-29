import torch
from captum.attr import IntegratedGradients

def compute_integrated_gradients(model, input_tensor, target_class=0):
    """
    Computes Integrated Gradients for classical NLP features to understand 
    feature attribution before the quantum layer.
    """
    ig = IntegratedGradients(model)
    # Ensure input tensor requires grad
    input_tensor.requires_grad_()
    
    # Compute attributions
    attributions, delta = ig.attribute(input_tensor, target=target_class, return_convergence_delta=True)
    return attributions, delta

def get_attention_maps(model, input_ids, attention_mask):
    """
    Extracts attention maps from the classical transformer backbone.
    """
    # HuggingFace specific extraction (assuming output_attentions=True was passed during model config)
    outputs = model(input_ids, attention_mask=attention_mask, output_attentions=True)
    if hasattr(outputs, "attentions"):
        return outputs.attentions
    return None
