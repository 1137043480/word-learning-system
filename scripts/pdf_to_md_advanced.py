from markitdown import MarkItDown
import os
from datetime import datetime
import json

def convert_pdf_with_options():
    """
    高级PDF转换功能，支持多种选项
    """
    md = MarkItDown()
    pdf_file = "毕业论文-康正伟-1601210580.pdf"
    
    if not os.path.exists(pdf_file):
        print(f"错误：找不到文件 {pdf_file}")
        return
    
    try:
        print("🔄 开始转换...")
        result = md.convert(pdf_file)
        
        # 保存多种格式
        base_name = "毕业论文-康正伟-1601210580"
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 1. 保存完整Markdown
        md_file = f"{base_name}_{timestamp}.md"
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write(result.text_content)
        
        # 2. 保存纯文本版本
        txt_file = f"{base_name}_{timestamp}.txt"
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(result.text_content)
        
        # 3. 保存转换信息
        info = {
            "source_file": pdf_file,
            "conversion_time": datetime.now().isoformat(),
            "content_length": len(result.text_content),
            "markdown_file": md_file,
            "text_file": txt_file
        }
        
        info_file = f"{base_name}_{timestamp}_info.json"
        with open(info_file, 'w', encoding='utf-8') as f:
            json.dump(info, f, indent=2, ensure_ascii=False)
        
        print(f"✅ 转换完成！生成文件:")
        print(f"  📄 Markdown: {md_file}")
        print(f"  📝 文本文件: {txt_file}")
        print(f"  ℹ️  转换信息: {info_file}")
        
        return md_file, txt_file, info_file
        
    except Exception as e:
        print(f"❌ 转换失败: {str(e)}")
        return None

if __name__ == "__main__":
    convert_pdf_with_options()
