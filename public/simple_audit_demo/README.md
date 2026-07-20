# 经典8×8手写数字教学子集

- 来源：UCI Machine Learning Repository, Optical Recognition of Handwritten Digits (DOI: 10.24432/C50P49)。
- 许可：CC BY 4.0。
- 原数据将手写数字表示为 8×8 像素网格，每个像素的强度是 0—16 的整数。
- 本课为了浏览器内训练速度，从官方 `optdigits.tra` 中每类固定随机选取100张，从 `optdigits.tes` 中每类选取30张，共1,300张。
- 前1,000张仅用于训练，后300张仅用于测试。
- 该数据集只用来讲解“神经网络如何从像素学会识别数字”，不是生产级票据OCR模型。
