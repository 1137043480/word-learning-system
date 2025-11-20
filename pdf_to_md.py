from markitdown import MarkItDown

md = MarkItDown()
result = md.convert("毕业论文-康正伟-1601210580.pdf")
print(result.text_content)