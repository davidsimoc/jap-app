import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList, ScrollView, ActivityIndicator, LayoutAnimation, Platform, TextInput } from 'react-native';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import hiraganaData from '@/assets/data/hiragana.json';
import dakutenHiraganaData from '@/assets/data/hiraganaDakuten.json';
import yoonHiraganaData from '@/assets/data/hiraganaYōon.json';
import katakanaData from '@/assets/data/katakana.json';
import dukatenKatakanaData from '@/assets/data/katakanaDakuten.json';
import yoonKatakanaData from '@/assets/data/katakanaYoon.json';
import { useTheme } from '@/components/ThemeContext'; // Calea corectă!
import { lightTheme, darkTheme } from '@/constants/Colors'; // Asigură-te că ai importat corect temele
import kanjiIndex from '@/assets/data/kanjiIndex.json';

const { width } = Dimensions.get('window');
const SIDE_PADDING = 20;
const CARD_MARGIN = 5;
const CONTENT_PADDING = SIDE_PADDING * 2;
const AVAILABLE_WIDTH = width - CONTENT_PADDING;
const CARD_SIZE = (AVAILABLE_WIDTH - (CARD_MARGIN * 2 * 5)) / 5;
const CARD_SIZE_KANJI = CARD_SIZE;

interface KanjiInfo { // Aici definim tipul datelor din kanjiDataN5
    onyomi: string[];
    kunyomi: string[];
    meaning: string;
    onyomiWords: { word: string; reading: string; meaning: string }[];
    kunyomiWords: { word: string; reading: string; meaning: string }[];
    examples: { sentence: string; reading: string; meaning: string }[];
}

const N5_KANJI_FALLBACK = [
    '一', '七', '万', '三', '上', '下', '中', '九', '二', '五',
    '人', '今', '休', '何', '先', '入', '八', '六', '円', '出',
    '前', '北', '十', '千', '午', '半', '南', '友', '右', '名',
    '四', '国', '土', '外', '大', '天', '女', '子', '学', '小',
    '山', '川', '左', '年', '後', '日', '時', '書', '月', '木',
    '本', '来', '東', '校', '母', '毎', '気', '水', '火', '父',
    '生', '男', '白', '百', '聞', '行', '西', '見', '話', '語',
    '読', '車', '金', '長', '間', '雨', '電', '食', '高'
];

const N4_KANJI_FALLBACK = [
    '不', '世', '主', '事', '京', '仕', '代', '以', '会', '住',
    '体', '作', '使', '借', '元', '兄', '公', '写', '冬', '切',
    '別', '力', '勉', '動', '医', '去', '口', '古', '台', '同',
    '味', '品', '員', '問', '図', '地', '堂', '場', '売', '夏',
    '夕', '多', '夜', '妹', '姉', '始', '字', '安', '室', '家',
    '少', '屋', '工', '帰', '広', '店', '度', '建', '弟', '強',
    '待', '心', '思', '急', '悪', '意', '手', '持', '教', '文',
    '料', '新', '方', '旅', '族', '早', '明', '映', '春', '昼',
    '曜', '有', '服', '朝', '業', '楽', '歌', '止', '正', '歩',
    '死', '注', '洋', '海', '漢', '牛', '物', '特', '犬', '理',
    '用', '田', '町', '画', '界', '病', '発', '目', '真', '着',
    '知', '研', '社', '私', '秋', '究', '空', '立', '答', '紙',
    '終', '習', '考', '者', '肉', '自', '色', '花', '英', '茶',
    '親', '言', '計', '試', '買', '貸', '質', '赤', '走', '起',
    '足', '転', '近', '送', '通', '週', '運', '道', '重', '野',
    '銀', '開', '院', '集', '青', '音', '題', '風', '飯', '飲',
    '館', '駅', '験', '魚', '鳥', '黒'
];

const N2_KANJI_FALLBACK = [
    '並', '丸', '久', '乱', '乳', '乾', '了', '介', '仏', '令', '仲', '伸', '伺', '低', '依', '個', '倍', '停', '傾', '像', '億', '兆', '児', '党', '兵', '冊', '再', '凍', '刊', '刷', '券', '刺', '則', '副', '劇', '効', '勇', '募', '勢', '包', '匹', '区', '卒', '協', '占', '印', '卵', '厚', '双', '叫', '召', '史', '各', '含', '周', '咲', '喫', '営', '団', '囲', '固', '圧', '坂', '均', '型', '埋', '城', '域', '塔', '塗', '塩', '境', '央', '奥', '姓', '委', '季', '孫', '宇', '宝', '寺', '封', '専', '将', '尊', '導', '届', '層', '岩', '岸', '島', '州', '巨', '巻', '布', '希', '帯', '帽', '幅', '干', '幼', '庁', '床', '底', '府', '庫', '延', '弱', '律', '復', '快', '恋', '患', '悩', '憎', '戸', '承', '技', '担', '拝', '拾', '挟', '捜', '捨', '掃', '掘', '採', '接', '換', '損', '改', '敬', '旧', '昇', '星', '普', '暴', '曇', '替', '札', '机', '材', '村', '板', '林', '枚', '枝', '枯', '柔', '柱', '査', '栄', '根', '械', '棒', '森', '植', '極', '橋', '欧', '武', '歴', '殿', '毒', '比', '毛', '氷', '永', '汗', '汚', '池', '沈', '河', '沸', '油', '況', '泉', '泊', '波', '泥', '浅', '浴', '涙', '液', '涼', '混', '清', '減', '温', '測', '湖', '湯', '湾', '湿', '準', '溶', '滴', '漁', '濃', '濯', '灯', '灰', '炭', '焼', '照', '燃', '燥', '爆', '片', '版', '玉', '珍', '瓶', '甘', '畜', '略', '畳', '療', '皮', '皿', '省', '県', '短', '砂', '硬', '磨', '祈', '祝', '祭', '禁', '秒', '移', '税', '章', '童', '競', '竹', '符', '筆', '筒', '算', '管', '築', '簡', '籍', '粉', '粒', '糸', '紅', '純', '細', '紹', '絡', '綿', '総', '緑', '線', '編', '練', '績', '缶', '署', '群', '羽', '翌', '耕', '肌', '肩', '肯', '胃', '胸', '脂', '脳', '腕', '腰', '膚', '臓', '臣', '舟', '航', '般', '芸', '荒', '荷', '菓', '菜', '著', '蒸', '蔵', '薄', '虫', '血', '衣', '袋', '被', '装', '裏', '補', '複', '角', '触', '訓', '設', '詞', '詰', '誌', '課', '諸', '講', '谷', '豊', '象', '貝', '貨', '販', '貯', '貿', '賞', '賢', '贈', '超', '跡', '踊', '軍', '軒', '軟', '軽', '輪', '輸', '辛', '農', '辺', '述', '逆', '造', '郊', '郵', '量', '針', '鈍', '鉄', '鉱', '銅', '鋭', '録', '門', '防', '陸', '隅', '階', '隻', '雇', '雲', '零', '震', '革', '順', '預', '領', '額', '香', '駐', '骨', '麦', '黄', '鼻', '齢'
];

const N1_KANJI_FALLBACK = [
    '丁', '丑', '且', '丘', '丙', '丞', '丹', '乃', '之', '乏', '乙', '也', '亀', '井', '亘', '亜', '亥', '亦', '亨', '享', '亭', '亮', '仁', '仙', '仮', '仰', '企', '伊', '伍', '伎', '伏', '伐', '伯', '伴', '伶', '伽', '但', '佐', '佑', '佳', '併', '侃', '侍', '侑', '価', '侮', '侯', '侵', '促', '俊', '俗', '保', '修', '俳', '俵', '俸', '倉', '倖', '倣', '倫', '倭', '倹', '偏', '健', '偲', '偵', '偽', '傍', '傑', '傘', '催', '債', '傷', '僕', '僚', '僧', '儀', '儒', '償', '允', '充', '克', '免', '典', '兼', '冒', '冗', '冠', '冴', '冶', '准', '凌', '凜', '凝', '凡', '凪', '凱', '凶', '凸', '凹', '刀', '刃', '刈', '刑', '削', '剖', '剛', '剣', '剤', '剰', '創', '功', '劣', '励', '劾', '勁', '勅', '勘', '勧', '勲', '勺', '匁', '匠', '匡', '匿', '升', '卑', '卓', '博', '卯', '即', '却', '卸', '厄', '厘', '厳', '又', '及', '叔', '叙', '叡', '句', '只', '叶', '司', '吉', '后', '吏', '吐', '吟', '呂', '呈', '呉', '哀', '哉', '哲', '唄', '唆', '唇', '唯', '唱', '啄', '啓', '善', '喚', '喝', '喪', '喬', '嗣', '嘆', '嘉', '嘱', '器', '噴', '嚇', '囚', '圏', '圭', '坑', '坪', '垂', '垣', '執', '培', '基', '堀', '堅', '堕', '堤', '堪', '塀', '塁', '塊', '塑', '塚', '塾', '墓', '墜', '墨', '墳', '墾', '壁', '壇', '壊', '壌', '士', '壮', '壱', '奇', '奈', '奉', '奎', '奏', '契', '奔', '奨', '奪', '奮', '奴', '如', '妃', '妄', '妊', '妙', '妥', '妨', '姫', '姻', '姿', '威', '娠', '娯', '婆', '婿', '媒', '媛', '嫁', '嫌', '嫡', '嬉', '嬢', '孔', '孟', '孤', '宏', '宗', '宙', '宜', '宣', '宥', '宮', '宰', '宴', '宵', '寂', '寅', '密', '寛', '寡', '寧', '審', '寮', '寸', '射', '尉', '尋', '尚', '尭', '就', '尺', '尼', '尽', '尾', '尿', '屈', '展', '属', '履', '屯', '岐', '岬', '岳', '峠', '峡', '峰', '峻', '崇', '崎', '崚', '崩', '嵐', '嵩', '嵯', '嶺', '巌', '巡', '巣', '巧', '己', '巳', '巴', '巽', '帆', '帝', '帥', '帳', '幕', '幣', '幹', '幻', '幽', '庄', '序', '庶', '康', '庸', '廃', '廉', '廊', '廷', '弁', '弊', '弐', '弓', '弔', '弘', '弥', '弦', '弧', '張', '弾', '彗', '彦', '彩', '彪', '彫', '彬', '彰', '影', '往', '征', '径', '徐', '従', '循', '微', '徳', '徴', '徹', '忌', '忍', '志', '応', '忠', '怜', '怠', '怪', '恒', '恕', '恨', '恩', '恭', '恵', '悌', '悔', '悟', '悠', '悦', '悼', '惇', '惑', '惜', '惟', '惣', '惨', '惰', '愁', '愉', '愚', '慈', '態', '慎', '慕', '慢', '慧', '慨', '慮', '慰', '慶', '憂', '憤', '憧', '憩', '憲', '憶', '憾', '懇', '懐', '懲', '懸', '我', '戒', '戯', '房', '扇', '扉', '扱', '扶', '批', '抄', '把', '抑', '抗', '択', '披', '抵', '抹', '抽', '拍', '拐', '拒', '拓', '拘', '拙', '拠', '拡', '括', '拳', '拷', '挑', '挙', '振', '挿', '据', '捷', '捺', '授', '掌', '排', '控', '推', '措', '掲', '描', '提', '揚', '握', '揮', '援', '揺', '搬', '搭', '携', '搾', '摂', '摘', '摩', '撃', '撤', '撮', '撲', '擁', '操', '擦', '擬', '攻', '故', '敏', '救', '敢', '敦', '整', '敵', '敷', '斉', '斎', '斐', '斗', '斜', '斤', '斥', '於', '施', '旋', '旗', '既', '旦', '旨', '旬', '旭', '旺', '昂', '昆', '昌', '昭', '是', '昴', '晃', '晉', '晏', '晟', '晨', '晶', '智', '暁', '暇', '暉', '暑', '暖', '暢', '暦', '暫', '曙', '曹', '朋', '朔', '朕', '朗', '朱', '朴', '朽', '杉', '李', '杏', '杜', '条', '松', '析', '枠', '枢', '架', '柄', '柊', '某', '染', '柚', '柳', '柾', '栓', '栗', '栞', '株', '核', '栽', '桂', '桃', '案', '桐', '桑', '桜', '桟', '梅', '梓', '梢', '梧', '梨', '棄', '棋', '棚', '棟', '棺', '椋', '椎', '検', '椰', '椿', '楊', '楓', '楠', '楼', '概', '榛', '槙', '槻', '槽', '標', '模', '樹', '樺', '橘', '檀', '欄', '欣', '欺', '欽', '款', '歓', '殉', '殊', '殖', '殴', '殻', '毅', '毬', '氏', '汁', '汐', '江', '汰', '汽', '沖', '沙', '没', '沢', '沼', '沿', '泌', '泡', '泣', '泰', '洞', '津', '洪', '洲', '洵', '洸', '派', '浄', '浜', '浦', '浩', '浪', '浸', '涯', '淑', '淡', '淳', '添', '渇', '渉', '渋', '渓', '渚', '渥', '渦', '湧', '源', '溝', '滅', '滉', '滋', '滑', '滝', '滞', '漂', '漆', '漏', '漠', '漫', '漬', '漱', '漸', '潔', '潜', '潟', '潤', '潮', '澄', '澪', '激', '濁', '濫', '瀬', '災', '炉', '炊', '炎', '為', '烈', '焦', '煩', '煮', '熊', '熙', '熟', '燎', '燦', '燿', '爵', '爽', '爾', '牧', '牲', '犠', '狂', '狩', '独', '狭', '猛', '猟', '猪', '献', '猶', '猿', '獄', '獣', '獲', '玄', '率', '玖', '玲', '珠', '班', '琉', '琢', '琳', '琴', '瑚', '瑛', '瑞', '瑠', '瑳', '瑶', '璃', '環', '甚', '甫', '甲', '畔', '畝', '異', '疎', '疫', '疾', '症', '痘', '痢', '痴', '癒', '癖', '皇', '皐', '皓', '盆', '益', '盛', '盟', '監', '盤', '盲', '盾', '眉', '看', '眸', '眺', '眼', '睡', '督', '睦', '瞬', '瞭', '瞳', '矛', '矢', '矯', '砕', '砲', '硝', '硫', '碁', '碑', '碧', '碩', '磁', '磯', '礁', '礎', '祉', '祐', '祥', '票', '禄', '禅', '禍', '禎', '秀', '秘', '租', '秦', '秩', '称', '稀', '稔', '稚', '稜', '稲', '稼', '稿', '穀', '穂', '穏', '穣', '穫', '穴', '窃', '窒', '窮', '窯', '竜', '竣', '端', '笙', '笛', '第', '笹', '筋', '策', '箇', '節', '範', '篤', '簿', '粋', '粗', '粘', '粛', '糖', '糧', '系', '糾', '紀', '紋', '納', '紗', '紘', '級', '紛', '素', '紡', '索', '紫', '紬', '累', '紳', '紺', '絃', '結', '絞', '絢', '統', '絹', '継', '綜', '維', '綱', '網', '輪', '綺', '綾', '緊', '緋', '締', '緩', '緯', '縁', '縄', '縛', '縦', '縫', '縮', '繁', '繊', '織', '繕', '繭', '繰', '罰', '罷', '羅', '羊', '義', '翁', '翔', '翠', '翻', '翼', '耀', '耐', '耗', '耶', '聖', '聡', '聴', '学', '肖', '肝', '肢', '肥', '肪', '肺', '胆', '胎', '胞', '胡', '胤', '胴', '脅', '脈', '脚', '脩', '脱', '脹', '腐', '腸', '膜', '膨', '臨', '臭', '至', '致', '興', '舌', '舎', '舗', '舜', '舶', '艇', '艦', '艶', '芋', '芙', '芝', '芳', '芹', '芽', '苑', '苗', '茂', '茄', '茅', '茉', '茎', '茜', '荘', '莉', '莞', '菊', '菌', '菖', '菫', '華', '萌', '萩', '葬', '葵', '蒔', '蒼', '蓄', '蓉', '蓮', '蔦', '蕉', '蕗', '薦', '薪', '薫', '藍', '藤', '藩', '藻', '蘭', '虎', '虐', '虚', '虜', '虞', '虹', '蚊', '蚕', '蛇', '蛍', '蛮', '蝶', '融', '衆', '街', '衛', '衝', '衡', '衰', '衷', '衿', '袈', '裁', '裂', '裕', '裟', '裸', '製', '褐', '褒', '襟', '襲', '覆', '覇', '視', '覧', '訂', '討', '託', '訟', '訳', '訴', '診', '証', '詐', '詔', '評', '詠', '詢', '詩', '該', '詳', '誇', '誉', '誓', '誕', '誘', '誠', '誼', '諄', '請', '諒', '諭', '諮', '諾', '謀', '謁', '謄', '謙', '謝', '謡', '謹', '譜', '譲', '護', '豆', '豚', '豪', '貞', '貢', '貫', '貴', '賀', '賃', '賄', '賊', '賓', '賜', '賠', '賦', '購', '赦', '赳', '赴', '趣', '距', '跳', '践', '踏', '躍', '軌', '軸', '較', '載', '捕', '輝', '輩', '轄', '辰', '辱', '迅', '迪', '迫', '迭', '透', '逐', '逓', '逝', '逮', '逸', '遂', '遇', '遍', '遣', '遥', '遭', '遮', '遵', '守', '遷', '遺', '遼', '避', '還', '邑', '那', '邦', '邪', '邸', '郁', '郎', '郡', '郭', '郷', '酉', '酌', '酔', '酢', '酪', '酬', '酵', '酷', '酸', '醜', '醸', '采', '釈', '釣', '鈴', '鉛', '鉢', '銃', '銑', '銘', '銭', '鋳', '鋼', '錘', '錠', '錦', '錬', '錯', '鍛', '鎌', '鎖', '鎮', '鏡', '鐘', '鑑', '閑', '閣', '閥', '閲', '闘', '阻', '阿', '附', '陛', '陣', '陥', '陪', '陰', '陳', '陵', '陶', '隆', '隊', '随', '隔', '障', '隠', '隣', '隷', '隼', '雄', '雅', '雌', '雛', '離', '雰', '雷', '需', '霊', '霜', '霞', '霧', '露', '靖', '鞠', '韻', '響', '項', '須', '頌', '頑', '頒', '頻', '顕', '顧', '颯', '飢', '飼', '飽', '飾', '養', '餓', '馨', '駄', '駆', '駒', '駿', '騎', '騒', '騰', '驚', '髄', '鬼', '魁', '魂', '魅', '魔', '鮎', '鮮', '鯉', '鯛', '鯨', '鳩', '鳳', '鴻', '鵬', '鶏', '鶴', '鷹', '鹿', '麗', '麟', '麻', '麿', '黎', '黙', '黛', '鼓'
];

const fetchN2Kanji = async (): Promise<string[]> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        return N2_KANJI_FALLBACK;
    } catch (error) {
        console.error('Error loading N2 Kanji:', error);
        return [];
    }
};

const fetchN1Kanji = async (): Promise<string[]> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return N1_KANJI_FALLBACK;
    } catch (error) {
        console.error('Error loading N1 Kanji:', error);
        return [];
    }
};

const N3_KANJI_FALLBACK = [
    '与', '両', '乗', '予', '争', '互', '亡', '交', '他', '付', '件', '任', '伝', '似', '位', '余', '例', '供', '便', '係', '信', '倒', '候', '値', '偉', '側', '偶', '備', '働', '優', '光', '全', '共', '具', '内', '冷', '処', '列', '初', '判', '利', '到', '制', '刻', '割', '加', '助', '努', '労', '務', '勝', '勤', '化', '単', '危', '原', '参', '反', '収', '取', '受', '号', '合', '向', '君', '否', '吸', '吹', '告', '呼', '命', '和', '商', '喜', '回', '因', '困', '園', '在', '報', '増', '聲', '変', '夢', '太', '夫', '失', '好', '妻', '娘', '婚', '婦', '存', '宅', '守', '完', '官', '定', '実', '客', '害', '容', '宿', '寄', '富', '寒', '寝', '察', '対', '局', '居', '差', '市', '師', '席', '常', '平', '幸', '幾', '座', '庭', '式', '引', '当', '形', '役', '彼', '徒', '得', '御', '必', '忘', '忙', '念', '怒', '怖', '性', '恐', '恥', '息', '悲', '情', '想', '愛', '感', '慣', '成', '戦', '戻', '所', '才', '打', '払', '投', '折', '抜', '抱', '押', '招', '指', '捕', '掛', '探', '支', '放', '政', '敗', '散', '数', '断', '易', '昔', '昨', '晩', '景', '晴', '暗', '暮', '曲', '更', '最', '望', '期', '未', '末', '束', '杯', '果', '格', '構', '様', '権', '横', '機', '欠', '次', '欲', '歯', '歳', '残', '段', '殺', '民', '求', '決', '治', '法', '泳', '洗', '活', '流', '浮', '消', '深', '済', '渡', '港', '満', '演', '点', '然', '煙', '熱', '犯', '状', '猫', '王', '現', '球', '產', '由', '申', '留', '番', '疑', '疲', '痛', '登', '皆', '盗', '直', '相', '眠', '石', '破', '確', '示', '礼', '社', '祈', '祉', '祐', '祖', '祝', '神', '福', '科', '程', '種', '積', '突', '窓', '笑', '等', '箱', '米', '精', '約', '組', '経', '給', '絵', '絶', '続', '緒', '罪', '置', '美', '老', '耳', '職', '育', '背', '能', '腹', '舞', '船', '良', '若', '苦', '草', '落', '葉', '薬', '術', '表', '要', '規', '覚', '観', '解', '記', '訪', '許', '認', '誤', '説', '調', '談', '論', '識', '警', '議', '譲', '護', '谷', '豆', '豊', '豚', '象', '豪', '貝', '貞', '負', '財', '貢', '貧', '貨', '販', '貫', '責', '貯', '貴', '買', '貸', '費', '資', '賛', '越', '路', '辞', '込', '迎', '返', '迷', '追', '退', '逃', '途', '速', '連', '進', '遅', '遊', '過', '達', '違', '遠', '適', '選', '部', '都', '配', '酒', '閉', '関', '降', '限', '除', '険', '陽', '際', '雑', '難', '雪', '静', '非', '面', '靴', '頂', '頭', '頼', '顔', '願', '類', '飛', '首', '馬', '髪', '鳴'
];

const fetchN3Kanji = async (): Promise<string[]> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        return N3_KANJI_FALLBACK;
    } catch (error) {
        console.error('Error loading N3 Kanji:', error);
        return [];
    }
};

const fetchN4Kanji = async (): Promise<string[]> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 800));
        return N4_KANJI_FALLBACK;
    } catch (error) {
        console.error('Error loading N4 Kanji:', error);
        return [];
    }
};

const fetchN5Kanji = async (): Promise<string[]> => {
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        return N5_KANJI_FALLBACK;

    } catch (error) {
        console.error('Eroare la încărcarea kanji N5:', error);
        return [];
    }
};

export default function HiraganaScreen() {
    const insets = useSafeAreaInsets();
    const { tab } = useLocalSearchParams();
    const [selectedTab, setSelectedTab] = useState<'hiragana' | 'katakana' | 'kanji'>('hiragana');

    useEffect(() => {
        if (tab === 'kanji') setSelectedTab('kanji');
        else if (tab === 'katakana') setSelectedTab('katakana');
        else if (tab === 'hiragana') setSelectedTab('hiragana');
    }, [tab]);
    const [basicData, setBasicData] = useState<any[]>([]);
    const [dakutenData, setDakutenData] = useState<any[]>([]);
    const [yoonData, setYoonData] = useState<any[]>([]);
    const [katakanaFlatData, setKatakanaFlatData] = useState<any[]>([]);
    const [katakanaDakutenFlatData, setKatakanaDakutenFlatData] = useState<any[]>([]);
    const [katakanaYoonFlatData, setKatakanaYoonFlatData] = useState<any[]>([]);

    // State pentru kanji cu API
    const [kanjiListN5, setKanjiListN5] = useState<string[]>([]);
    const [kanjiListN4, setKanjiListN4] = useState<string[]>([]);
    const [kanjiListN3, setKanjiListN3] = useState<string[]>([]);
    const [kanjiListN2, setKanjiListN2] = useState<string[]>([]);
    const [kanjiListN1, setKanjiListN1] = useState<string[]>([]);
    const [kanjiLoading, setKanjiLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});
    const kanjiScrollViewRef = useRef<ScrollView>(null);

    const { theme, toggleTheme } = useTheme(); // Acum funcționează corect!
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;

    useEffect(() => {
        if (selectedTab === 'hiragana') {
            setBasicData(hiraganaData.flatMap((section) => section.rows));
            setDakutenData(dakutenHiraganaData.flatMap((section) => section.rows));
            setYoonData(yoonHiraganaData.flatMap((section) => section.rows));
        } else if (selectedTab === 'katakana') {
            setKatakanaFlatData(katakanaData.flatMap((section) => section.rows));
            setKatakanaDakutenFlatData(dukatenKatakanaData.flatMap((section) => section.rows));
            setKatakanaYoonFlatData(yoonKatakanaData.flatMap((section) => section.rows));
        } else if (selectedTab === 'kanji') {
            // Încarcă kanji doar dacă nu sunt deja încărcate
            if (kanjiListN5.length === 0 && !kanjiLoading) {
                loadKanjiData();
            }
        }
    }, [selectedTab]);

    // Funcția pentru a încărca kanji N5, N4, N3, N2 și N1
    const loadKanjiData = async () => {
        setKanjiLoading(true);
        try {
            const [n5, n4, n3, n2, n1] = await Promise.all([
                fetchN5Kanji(),
                fetchN4Kanji(),
                fetchN3Kanji(),
                fetchN2Kanji(),
                fetchN1Kanji()
            ]);
            setKanjiListN5(n5);
            setKanjiListN4(n4);
            setKanjiListN3(n3);
            setKanjiListN2(n2);
            setKanjiListN1(n1);
        } catch (error) {
            console.error('Eroare la încărcarea kanji:', error);
        } finally {
            setKanjiLoading(false);
        }
    };

    const filteredKanji = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return { n5: kanjiListN5, n4: kanjiListN4, n3: kanjiListN3, n2: kanjiListN2, n1: kanjiListN1 };

        const filterList = (list: string[]) => list.filter(kanji => {
            if (kanji.includes(query)) return true;
            // Căutăm în indexul slim (N5-N1)
            const meaning = (kanjiIndex as Record<string, string>)[kanji];
            if (meaning && meaning.toLowerCase().includes(query)) return true;
            return false;
        });

        return {
            n5: filterList(kanjiListN5),
            n4: filterList(kanjiListN4),
            n3: filterList(kanjiListN3),
            n2: filterList(kanjiListN2),
            n1: filterList(kanjiListN1)
        };
    }, [searchQuery, kanjiListN5, kanjiListN4, kanjiListN3, kanjiListN2, kanjiListN1]);

    const scrollToSection = (level: string) => {
        if (sectionPositions[level] !== undefined && kanjiScrollViewRef.current) {
            kanjiScrollViewRef.current.scrollTo({
                y: sectionPositions[level],
                animated: true
            });
        }
    };


    const renderItem = ({ item }: { item: { romaji: string; kana: string } }, listType: 'basic' | 'dakuten' | 'yoon' | 'katakana') => (
        <View style={[styles.card, listType === 'yoon' && styles.yoonCard, { backgroundColor: currentTheme.surface }]}>
            <Text style={{ ...styles.kana, color: currentTheme.accent }}>{item.kana}</Text>
            <Text style={{ ...styles.romaji, color: currentTheme.text }}>{item.romaji}</Text>
        </View>
    );
    const renderKanjiItem = ({ item }: { item: string }) => {
        return (
            <TouchableOpacity style={{ ...styles.kanjiCard, backgroundColor: currentTheme.surface }} onPress={() => router.push(`./${item}`)}>
                <Text style={{ ...styles.kanjiText, color: currentTheme.accent }}>{item}</Text>
            </TouchableOpacity>
        );
    };
    const renderSectionHeader = ({ section }: { section: any }) => (
        <Text style={{ ...styles.category, color: currentTheme.text }}>{section.title}</Text>
    );



    return (
        <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <View>
                    <Text style={[styles.headerSubtitle, { color: currentTheme.text + '60' }]}>LANGUAGE HUB</Text>
                    <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Library</Text>
                </View>
                <TouchableOpacity
                    style={[styles.translateHeaderButton, { backgroundColor: currentTheme.primary + '10' }]}
                    onPress={() => router.push('/kanji/translator')}
                >
                    <Ionicons name="language" size={18} color={currentTheme.primary} />
                    <Text style={[styles.translateBtnText, { color: currentTheme.primary }]}>Translate</Text>
                </TouchableOpacity>
            </View>

            {/* Premium Segmented Control */}
            <View style={styles.segmentedWrapper}>
                <View style={[styles.tabContainer, { backgroundColor: currentTheme.surface, borderColor: currentTheme.text + '05' }]}>
                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedTab('hiragana');
                        }}
                        style={[
                            styles.tab,
                            selectedTab === 'hiragana' && { backgroundColor: currentTheme.primary }
                        ]}
                    >
                        <Text style={[styles.tabText, { color: selectedTab === 'hiragana' ? '#fff' : currentTheme.text + '60' }]}>
                            Hiragana
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedTab('katakana');
                        }}
                        style={[
                            styles.tab,
                            selectedTab === 'katakana' && { backgroundColor: currentTheme.primary }
                        ]}
                    >
                        <Text style={[styles.tabText, { color: selectedTab === 'katakana' ? '#fff' : currentTheme.text + '60' }]}>
                            Katakana
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setSelectedTab('kanji');
                        }}
                        style={[
                            styles.tab,
                            selectedTab === 'kanji' && { backgroundColor: currentTheme.primary }
                        ]}
                    >
                        <Text style={[styles.tabText, { color: selectedTab === 'kanji' ? '#fff' : currentTheme.text + '60' }]}>
                            Kanji
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={[styles.content, { backgroundColor: currentTheme.background }]}>
                {selectedTab === 'hiragana' && (
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.category, { color: currentTheme.text }]}>Hiragana</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>The main Japanese writing system</Text>
                        <FlatList
                            data={basicData}
                            renderItem={(props) => renderItem(props, 'basic')}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Dakuten</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A symbol changes the sound</Text>
                        <FlatList
                            data={dakutenData}
                            renderItem={(props) => renderItem(props, 'dakuten')}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Yōon (Combinations)</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A small character to make new syllable</Text>
                        <FlatList
                            data={yoonData}
                            renderItem={(props) => renderItem(props, 'yoon')}
                            keyExtractor={(item, index) => `yoon-${index}`}
                            numColumns={3}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    </ScrollView>
                )}

                {selectedTab === 'katakana' && (
                    <ScrollView
                        style={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <Text style={[styles.category, { color: currentTheme.text }]}>Katakana</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Characters used for loanwords</Text>
                        <FlatList
                            data={katakanaFlatData}
                            renderItem={(props) => renderItem(props, 'basic')}
                            keyExtractor={(item, index) => `basic-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Dakuten</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A symbol changes the sound</Text>
                        <FlatList
                            data={katakanaDakutenFlatData}
                            renderItem={(props) => renderItem(props, 'dakuten')}
                            keyExtractor={(item, index) => `dakuten-${index}`}
                            numColumns={5}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                        <View style={[styles.separator, { borderBottomColor: currentTheme.border }]} />

                        <Text style={[styles.category, { color: currentTheme.text }]}>Yōon (Combinations)</Text>
                        <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>A small character to make new syllable</Text>
                        <FlatList
                            data={katakanaYoonFlatData}
                            renderItem={(props) => renderItem(props, 'yoon')}
                            keyExtractor={(item, index) => `yoon-${index}`}
                            numColumns={3}
                            columnWrapperStyle={styles.row}
                            scrollEnabled={false}
                        />
                    </ScrollView>
                )}

                {selectedTab === 'kanji' && (
                    <View style={{ flex: 1 }}>
                        {/* Search Bar & Quick Selector Stacked Sticky Area */}
                        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
                            <View style={[styles.searchContainer, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                                <Ionicons name="search" size={20} color={currentTheme.text + '60'} />
                                <TextInput
                                    style={[styles.searchInput, { color: currentTheme.text }]}
                                    placeholder="Search Kanji or Meaning..."
                                    placeholderTextColor={currentTheme.text + '40'}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCorrect={false}
                                />
                                {searchQuery !== '' && (
                                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                                        <Ionicons name="close-circle" size={20} color={currentTheme.text + '40'} />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.levelSelector}
                            >
                                {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[styles.levelButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                                        onPress={() => scrollToSection(level)}
                                    >
                                        <Text style={[styles.levelButtonText, { color: currentTheme.primary }]}>{level}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <ScrollView
                            ref={kanjiScrollViewRef}
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
                        >
                            {filteredKanji.n5.length > 0 && (
                                <View onLayout={(e) => {
                                    const { y } = e.nativeEvent.layout;
                                    setSectionPositions(prev => ({ ...prev, N5: y }));
                                }}>
                                    <Text style={[styles.category, { color: currentTheme.text }]}>Kanji (N5)</Text>
                                    <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Essential characters for daily life</Text>
                                    <FlatList
                                        data={filteredKanji.n5}
                                        renderItem={renderKanjiItem}
                                        keyExtractor={(item) => item}
                                        numColumns={5}
                                        columnWrapperStyle={styles.row}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}

                            {filteredKanji.n4.length > 0 && (
                                <View
                                    style={{ marginTop: 40 }}
                                    onLayout={(e) => {
                                        const { y } = e.nativeEvent.layout;
                                        setSectionPositions(prev => ({ ...prev, N4: y }));
                                    }}
                                >
                                    <Text style={[styles.category, { color: currentTheme.text }]}>Kanji (N4)</Text>
                                    <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Intermediate characters for communication</Text>
                                    <FlatList
                                        data={filteredKanji.n4}
                                        renderItem={renderKanjiItem}
                                        keyExtractor={(item) => item}
                                        numColumns={5}
                                        columnWrapperStyle={styles.row}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}

                            {filteredKanji.n3.length > 0 && (
                                <View
                                    style={{ marginTop: 40 }}
                                    onLayout={(e) => {
                                        const { y } = e.nativeEvent.layout;
                                        setSectionPositions(prev => ({ ...prev, N3: y }));
                                    }}
                                >
                                    <Text style={[styles.category, { color: currentTheme.text }]}>Kanji (N3)</Text>
                                    <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Contextual characters for daily interactions</Text>
                                    <FlatList
                                        data={filteredKanji.n3}
                                        renderItem={renderKanjiItem}
                                        keyExtractor={(item) => item}
                                        numColumns={5}
                                        columnWrapperStyle={styles.row}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}

                            {filteredKanji.n2.length > 0 && (
                                <View
                                    style={{ marginTop: 40 }}
                                    onLayout={(e) => {
                                        const { y } = e.nativeEvent.layout;
                                        setSectionPositions(prev => ({ ...prev, N2: y }));
                                    }}
                                >
                                    <Text style={[styles.category, { color: currentTheme.text }]}>Kanji (N2)</Text>
                                    <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Advanced characters for professional literacy</Text>
                                    <FlatList
                                        data={filteredKanji.n2}
                                        renderItem={renderKanjiItem}
                                        keyExtractor={(item) => item}
                                        numColumns={5}
                                        columnWrapperStyle={styles.row}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}

                            {filteredKanji.n1.length > 0 && (
                                <View
                                    style={{ marginTop: 40 }}
                                    onLayout={(e) => {
                                        const { y } = e.nativeEvent.layout;
                                        setSectionPositions(prev => ({ ...prev, N1: y }));
                                    }}
                                >
                                    <Text style={[styles.category, { color: currentTheme.text }]}>Kanji (N1)</Text>
                                    <Text style={[styles.subtitle, { color: currentTheme.text + '60' }]}>Mastery level characters for complete fluency</Text>
                                    <FlatList
                                        data={filteredKanji.n1}
                                        renderItem={renderKanjiItem}
                                        keyExtractor={(item) => item}
                                        numColumns={5}
                                        columnWrapperStyle={styles.row}
                                        scrollEnabled={false}
                                    />
                                </View>
                            )}

                            {filteredKanji.n5.length === 0 && filteredKanji.n4.length === 0 && filteredKanji.n3.length === 0 && filteredKanji.n2.length === 0 && filteredKanji.n1.length === 0 && (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Ionicons name="search-outline" size={60} color={currentTheme.text + '20'} />
                                    <Text style={{ color: currentTheme.text + '60', marginTop: 10, fontSize: 16 }}>No Kanji found for "{searchQuery}"</Text>
                                </View>
                            )}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 4,
    },
    themeToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    segmentedWrapper: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 16,
        borderWidth: 1,
    },
    tab: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 120,
    },
    separator: {
        height: 1,
        width: '90%',
        alignSelf: 'center',
        marginVertical: 30,
        opacity: 0.1,
        borderBottomWidth: 1,
    },
    card: {
        width: CARD_SIZE,
        height: CARD_SIZE + 10,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 10,
            },
            android: { elevation: 2 },
        }),
    },
    category: {
        fontSize: 22,
        fontWeight: '900',
        marginBottom: 4,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 20,
        opacity: 0.5,
    },
    kana: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 2,
    },
    romaji: {
        fontSize: 12,
        fontWeight: '800',
        opacity: 0.4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
    },
    rowKanji: {
        justifyContent: 'center',
    },
    yoonCard: {
        width: (width - 60) / 3,
        height: CARD_SIZE + 15,
    },
    kanjiCard: {
        width: CARD_SIZE_KANJI,
        height: CARD_SIZE_KANJI,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 15,
        margin: 5,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    kanjiText: {
        fontSize: 24,
        fontWeight: '700',
    },
    kanjiListContainer: {
        paddingBottom: 120,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: { elevation: 2 },
        }),
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    levelSelector: {
        flexDirection: 'row',
        paddingVertical: 5,
    },
    levelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        borderWidth: 1,
        minWidth: 60,
        alignItems: 'center',
    },
    levelButtonText: {
        fontSize: 14,
        fontWeight: '800',
    },
    translateHeaderButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    translateBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
});
