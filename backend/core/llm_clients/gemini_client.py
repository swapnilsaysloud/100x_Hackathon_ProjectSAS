import os
import google.generativeai as genai
from google.generativeai.types import GenerationConfigDict, SafetySettingDict, HarmCategory, HarmBlockThreshold
from dotenv import load_dotenv
from typing import Optional, List, Union, Dict, Any

# It's good practice to call load_dotenv() once at the application entry point
# but having it here ensures it's loaded if this module is imported directly.
load_dotenv()

class GeminiClient:
    """
    A client for interacting with the Google Gemini API.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = "gemini-1.5-flash-latest", # A more common and recent model
    ):
        """
        Initializes the Gemini client.

        Args:
            api_key (Optional[str]): The Gemini API key. If None, it will try to load
                                     from the "GEMINI_API" environment variable.
            model_name (str): The name of the Gemini model to use.
                              Defaults to "gemini-1.5-flash-latest".
        """
        if api_key is None:
            api_key = os.getenv("GEMINI_API_KEY") # Common practice to name it GEMINI_API_KEY
            if not api_key: # Check if it was os.getenv("GEMINI_API") in the original .env
                api_key = os.getenv("GEMINI_API")

        if not api_key:
            raise ValueError(
                "Missing Gemini API key. Set GEMINI_API_KEY (or GEMINI_API) environment variable or pass it as an argument."
            )

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        print(f"GeminiClient initialized with model: {model_name}")

    def complete(
        self,
        prompt: Union[str, List[Union[str, genai.types.ContentDict]]],
        generation_config: Optional[GenerationConfigDict] = None,
        safety_settings: Optional[List[SafetySettingDict]] = None,
        stream: bool = False # Added stream option
    ) -> Union[str, genai.types.GenerateContentResponse]: # Return type changes if streaming
        """
        Generates content based on the provided prompt.

        Args:
            prompt (Union[str, List[Union[str, genai.types.ContentDict]]]):
                The prompt string or a list of content parts for more complex inputs.
            generation_config (Optional[GenerationConfigDict]): Configuration for generation
                (e.g., temperature, max_output_tokens).
            safety_settings (Optional[List[SafetySettingDict]]): Safety settings for content generation.
            stream (bool): Whether to stream the response. If True, returns an iterator.

        Returns:
            Union[str, Iterator[GenerateContentResponse]]: The generated text, or an iterator
            of response chunks if streaming. If content is blocked or an error occurs,
            an error message or an empty string might be returned (or an exception raised).

        Raises:
            RuntimeError: If the API call fails or content is not generated properly.
        """
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=generation_config,
                safety_settings=safety_settings,
                stream=stream
            )

            if stream:
                # If streaming, the caller is responsible for iterating and handling errors/parts
                return response

            # --- Non-streaming response handling ---
            # Check for blocked content first
            if not response.candidates:
                block_reason = "Unknown"
                block_message = "No candidates returned."
                if response.prompt_feedback and response.prompt_feedback.block_reason:
                    block_reason = response.prompt_feedback.block_reason.name
                    block_message = response.prompt_feedback.block_reason_message or "Content blocked by safety filters."
                # You might want to raise an exception here or log more verbosely
                # For now, returning an informative string
                error_msg = f"Content generation failed or was blocked. Reason: {block_reason}. Message: {block_message}"
                print(f"Warning: {error_msg}")
                # Depending on desired behavior, either raise an error or return specific message
                # raise RuntimeError(error_msg)
                return f"Error: {block_message}"


            # Access text content safely
            # response.text is a shortcut, but it's good to be explicit
            full_text = []
            for candidate in response.candidates:
                if candidate.content and candidate.content.parts:
                    for part in candidate.content.parts:
                        if hasattr(part, 'text'):
                            full_text.append(part.text)
            
            if not full_text and hasattr(response, 'text') and response.text: # Fallback for simple cases
                 return response.text
            elif not full_text:
                # This case might occur if the response was successful but generated no text (e.g. function call)
                # or if the structure is different than expected.
                # For simple text generation, this usually means an issue or empty valid output.
                finish_reason = response.candidates[0].finish_reason if response.candidates else "UNKNOWN"
                if str(finish_reason) != "STOP": # Using str() because finish_reason is an enum
                     print(f"Warning: No text parts found in response, but finish reason was {finish_reason}.")
                return "" # Or handle as an error

            return "".join(full_text)

        except Exception as e:
            # Log the exception for debugging
            # import logging
            # logging.exception("Gemini API request failed")
            print(f"Error during Gemini API request: {e}")
            raise RuntimeError(f"Gemini API request failed: {e}") from e

    def start_chat(
        self,
        history: Optional[List[genai.types.ContentDict]] = None,
        enable_automatic_function_calling: bool = False
    ) -> genai.ChatSession:
        """
        Starts a new chat session or continues an existing one.

        Args:
            history (Optional[List[ContentDict]]): A list of previous chat messages
                to initialize the chat history.
            enable_automatic_function_calling (bool): Whether to enable automatic function calling.

        Returns:
            genai.ChatSession: An active chat session object.
        """
        return self.model.start_chat(
            history=history or [],
            enable_automatic_function_calling=enable_automatic_function_calling
        )