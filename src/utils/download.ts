export const downloadFile = (result: Blob | null, outputFileName: string) => {
    if (result) {
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = outputFileName;
        a.click();
        URL.revokeObjectURL(url);
    }
};