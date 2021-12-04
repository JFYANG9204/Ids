# Ids

此扩展是IBM DataCollection Script Basic & Metadata的解析器

## 功能

基于IBM DataCollection文法，提供:

+ 语法和语义解析并报错
+ 忽略错误的快速恢复
+ 悬停提示
+ 补全提示
+ 方法和函数的参数提示
+ 定义跳转
+ 引用查询

## 备注

+ 如果文件引用并不是直接在`#inlcude`中定义的，可以在被引用文件头部添加注释，
  格式如下，其中`filePath`为引用文件的相对路径，`refName`为对应变量名:

    ```vb
    ' "filePath"@refName
    ```

