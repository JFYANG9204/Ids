
namespace ds {

    /**
     * 保存文件基本信息的对象，用于读取文件夹内容和解析器初始化
     */
    export interface SourceFile {
        /**
         * 当前源文件的文本内容
         */
        text: string;
        /**
         * 文本的所有行起始位置
         */
        lineStarts?: number[];
        /**
         * 源文件类型，分为
         * + 元数据 'metadata'  (一般为.mrs扩展名的文件)
         * + 声明文件 'declare' (用于引入初始定义)
         * + 脚本文件 'script'  (包含.dms和.mrs扩展名的脚本文件)
         */
        kind: FileKind;
        /**
         * 文件的系统路径
         */
        fsPath: string;
    }


}

