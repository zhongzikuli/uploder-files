/*
* created by zhongzikuli<hgb102xlg@126.com> on 17/10/9.
* */
$(document).ready(function () {
    var fileUpload = new uploaderFile({
        auto: true,
        fileNumLimit: 100,
        containerId: '#uploader',
        uploadImg: false,//图片上传标记
        fileSizeLimit: 1048576 * 500,
        fileSingleSizeLimit: 1048576 * 10,
        dropTip: '',
        buttonText: '选择文件',
        server: '/fdfs/uploadFile.action'
    });
});