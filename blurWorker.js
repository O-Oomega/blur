// 这个文件将处理图像模糊的计算
onmessage = function(e) {
    // 导入模糊算法脚本
    // importScripts('blur.js');

    const { matrix, type, imageSize, stdDeviation } = e.data;

    let result;
    if (type === 'boxBlur') {
        result = boxBlur(matrix, imageSize, imageSize);
    } else if (type === 'gaussianBlur') {
        result = gaussianBlur(matrix, imageSize, imageSize, stdDeviation);
    }

    postMessage({blurredMatrix:result, type});
};

// matrix is a Uint8ClampedArray
const boxBlur = (matrix, width, height) => {
    // console.log("this is box blur");
    // 对每个像素进行卷积处理
    const blurredMatrix = new Uint8ClampedArray(matrix.length);

    // 卷积核尺寸
    const kernelSize = 13;
    // 计算边缘宽度
    const edge = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let totalRed = 0, totalGreen = 0, totalBlue = 0;
            let count = 0;

            for (let ky = -edge; ky <= edge; ky++) {
                for (let kx = -edge; kx <= edge; kx++) {
                    const pixelX = Math.min(width - 1, Math.max(0, x + kx));
                    const pixelY = Math.min(height - 1, Math.max(0, y + ky));
                    const pixelIndex = (pixelY * width + pixelX) * 4;

                    totalRed += matrix[pixelIndex];
                    totalGreen += matrix[pixelIndex + 1];
                    totalBlue += matrix[pixelIndex + 2];
                    count++;
                }
            }

            const index = (y * width + x) * 4;
            blurredMatrix[index] = totalRed / count;
            blurredMatrix[index + 1] = totalGreen / count;
            blurredMatrix[index + 2] = totalBlue / count;
            blurredMatrix[index + 3] = matrix[index + 3]; // Preserve the alpha channel
        }
    }
    
    return blurredMatrix
};

// 高斯模糊
const gaussianBlur = (matrix, width, height, stdDeviation = 3.5) => {
    // console.log("this is gaussian blur");
    // 计算卷积核尺寸
    const kernelSize = 2 * Math.ceil(3 * stdDeviation) + 1
    /* 
        计算卷积尺寸的两个因素：
            1、高斯函数的标准差stdDeviation
            2、确保卷积核覆盖足够的区域以捕获必要的像素信息
        注：
            1、一个物理尺寸太小的卷积核可能无法充分考虑足够多的相邻像素，导致模糊效果不明显。
            2、一个物理尺寸合适，但是标准差不当的卷积核能够考虑足够多的相邻像素，但是各个像素的影响权重计算不当，也会导致模糊效果不合预期。

    */

    // 计算边缘宽度
    const edge = Math.floor(kernelSize / 2);

    // 创建高斯卷积核
    const kernel = createGaussianKernel(kernelSize, stdDeviation, edge);

    const blurredMatrix = new Uint8ClampedArray(matrix.length);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let totalRed = 0, totalGreen = 0, totalBlue = 0, totalWeight = 0;

            for (let ky = -edge; ky <= edge; ky++) {
                for (let kx = -edge; kx <= edge; kx++) {
                    const pixelX = Math.min(width - 1, Math.max(0, x + kx));
                    const pixelY = Math.min(height - 1, Math.max(0, y + ky));
                    const pixelIndex = (pixelY * width + pixelX) * 4;
                    const weight = kernel[ky + edge][kx + edge];

                    totalRed += matrix[pixelIndex] * weight;
                    totalGreen += matrix[pixelIndex + 1] * weight;
                    totalBlue += matrix[pixelIndex + 2] * weight;
                    totalWeight += weight;
                }
            }

            const index = (y * width + x) * 4;
            blurredMatrix[index] = totalRed / totalWeight;
            blurredMatrix[index + 1] = totalGreen / totalWeight;
            blurredMatrix[index + 2] = totalBlue / totalWeight;
            blurredMatrix[index + 3] = matrix[index + 3]; // 保持alpha通道不变
        }
    }

    return blurredMatrix
}

// 创建高斯卷积核
const createGaussianKernel = (size, stdDeviation, edge) => {
    const kernel = new Array(size);
    let total = 0;

    for (let x = -edge; x <= edge; x++) {
        kernel[x + edge] = new Array(size);
        for (let y = -edge; y <= edge; y++) {
            const value = gaussian(x, y, stdDeviation);
            // 实际的数组 kernel 中，我们不能有负索引
            kernel[x + edge][y + edge] = value;
            total += value;
        }
    }

    // 归一化卷积核
    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            kernel[x][y] /= total;
        }
    }

    return kernel;
};

// 高斯函数
const gaussian = (x, y, stdDeviation) => {
    return Math.exp(-(x * x + y * y) / (2 * stdDeviation * stdDeviation)) / (2 * Math.PI * stdDeviation * stdDeviation);
};