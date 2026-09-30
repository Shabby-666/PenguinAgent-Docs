"""让标题锚点保留中文。

mkdocs 内置的 ``markdown.extensions.toc.slugify`` 默认只保留 ASCII 字母数字，
中文标题会被剥成空串，再由 toc 追加去重后缀，于是：

    ## 自定义命令   ->   id="_1"

结果是所有指向中文标题的锚点链接都失效，构建时还会报
``contains a link ..., but the doc ... does not contain an anchor``。
本文件提供保留 Unicode 的版本，在 ``mkdocs.yml`` 里通过
``toc: slugify: !!python/name:hooks.keep_cjk`` 引用。
"""

from markdown.extensions.toc import slugify as _ascii_slugify


def keep_cjk(value, separator, unicode=False):
    """与内置 slugify 相同，但强制按 Unicode 处理，中文不再被剥掉。"""
    return _ascii_slugify(value, separator, True)
