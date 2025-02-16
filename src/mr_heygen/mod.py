from lib.providers.commands import command
import json
import os
import asyncio

@command()
async def get_object_images(abs_image_file_path: str, class_names: str, context=None):

if __name__ == "__main__":
    asyncio.run(get_object_images("baseballcards.jpg", "baseball card, trading card, card"))
    
