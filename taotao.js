import plugin from '../../lib/plugins/plugin.js';
import { segment } from "icqq";
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Taotao extends plugin {
    constructor() {
        super({
            name: '桃桃运势签',
            dsc: '桃桃风格的每日运势打卡',
            event: 'message',
            priority: 6,
            rule: [
                {
                    reg: '^#?(打卡|签到)$',
                    fnc: 'dailySign'
                },
                {
                    reg: '^#?(今日欧皇|往生之星)$',
                    fnc: 'luckyStar'
                }
            ]
        });

        // 普通签到图片
        this.normalImages = [
            path.join(__dirname, 'img/hutao1.jpg'),
            path.join(__dirname, 'img/hutao2.jpg'),
            path.join(__dirname, 'img/hutao3.jpg'),
            path.join(__dirname, 'img/hutao7.jpg'),
            path.join(__dirname, 'img/hutao8.jpg'),
            path.join(__dirname, 'img/hutao10.jpg')
        ];
        
        // 重复签到专用图片
        this.repeatImages = [
            path.join(__dirname, 'img/hutao4.jpg'),
            path.join(__dirname, 'img/hutao5.jpg'),
            path.join(__dirname, 'img/hutao6.jpg'),
            path.join(__dirname, 'img/hutao9.jpg')
        ];
    }

    // 获取北京时间（东八区）
    getBeijingDate() {
        return new Date(Date.now() + 8 * 3600 * 1000).toISOString().split('T')[0];
    }

    async dailySign(e) {
        try {
            const date = this.getBeijingDate(); // 使用东八区日期
            const lastDate = await redis.get(`hutao:sign:${e.user_id}`);
            const lastScore = await redis.get(`hutao:score:${e.user_id}`);

            if (lastDate === date) {
                await this.sendMessage(e, 
                    `✨ 今日已签到 ✨\n幸运值：${lastScore}\n明天再来找桃桃玩吧~`,
                    this.repeatImages
                );
                return;
            }

            const score = Math.floor(Math.random() * 101);
            await redis.set(`hutao:sign:${e.user_id}`, date);
            await redis.set(`hutao:score:${e.user_id}`, score);

            if (score === 100) {
                await redis.set('hutao:lucky_star', JSON.stringify({
                    name: e.nickname,
                    qq: e.user_id,
                    date: date
                }));
            }

            await this.sendMessage(e,
                `✨ 签到成功 ✨\n今日幸运值：${score}\n${this.getComment(score)}`,
                this.normalImages
            );
        } catch (err) {
            console.error('签到出错:', err);
            await e.reply('签到失败啦~可能是往生堂太忙了（请稍后再试）');
        }
    }

    async luckyStar(e) {
        try {
            const data = await redis.get('hutao:lucky_star');
            if (!data) {
                await e.reply('今天的欧皇还没出现呢~\n快签到看看会不会是你！');
                return;
            }

            const { name, qq, date } = JSON.parse(data);
            const today = this.getBeijingDate();
            
            if (date !== today) {
                await e.reply('今天的欧皇还没出现呢~\n快签到看看会不会是你！');
                return;
            }

            await this.sendMessage(e,
                `🎉 往生堂今日之星 🎉\n幸运儿：${name}(${qq})\n幸运值：100！\n桃桃给你撒花花~`,
                this.normalImages
            );
        } catch (err) {
            console.error('查询欧皇出错:', err);
            await e.reply('找欧皇时迷路啦~');
        }
    }

    async sendMessage(e, text, imageArray) {
        try {
            const imagePath = this.getRandomImage(imageArray);
            await e.reply([
                segment.image(`file://${imagePath}`),
                text
            ]);
        } catch (err) {
            console.error('发送图片失败:', err);
            await e.reply(`${text}\n（图片加载失败啦~桃桃下次补给你）`);
        }
    }

    getRandomImage(imageArray) {
        return imageArray[Math.floor(Math.random() * imageArray.length)];
    }

    getComment(score) {
        const comments = {
            100: [
                "✨ 天命之人！冥蝶为你起舞~",
                "🎊 往生堂VIP！桃桃给你免单啦！",
                "🌟 哇！100分！桃桃要给你当一天导游！",
                "💫 天选之子！今天买棺材打一折哦~"
            ],
            90: [
                "🌸 祥瑞之兆~今天适合抽卡！",
                "🍀 哇哦！桃桃想和你一起冒险！",
                "🎯 幸运爆棚！要不要来往生堂喝茶？",
                "💐 今天会有好事发生呢~"
            ],
            80: [
                "👍 运气不错！桃桃给你点赞~",
                "🎫 今天可以试试买彩票哦！",
                "🦋 冥冥之中自有天意~",
                "💝 往生堂今日特惠等着你！"
            ],
            70: [
                "🍵 平稳的一天~桃桃保佑你",
                "🌈 小幸运正在路上啦~",
                "🎨 今天适合尝试新事物！",
                "😊 保持微笑会有好运哦~"
            ],
            60: [
                "☁️ 平平无奇的一天呢",
                "🛌 中规中矩~桃桃也觉得还行",
                "🍃 普通的日子也要开心呀~",
                "🐟 今天适合摸鱼！"
            ],
            50: [
                "⚖️ 五五开的一天~不上不下",
                "⚠️ 桃桃说今天要小心台阶",
                "☯️ 中庸之道~平安是福",
                "🏠 今天适合在家休息"
            ],
            40: [
                "👻 小心背后有小幽灵哦",
                "🧿 需要护身符吗？桃桃特制版~",
                "👀 今天走路要看路哦",
                "🌥️ 运势平平~但明天会更好"
            ],
            30: [
                "😱 呜哇~往生堂特别服务要不要？",
                "💢 今天可能会遇到小麻烦呢",
                "💧 桃桃建议你今天多喝水",
                "🕯️ 运势低迷~但桃桃会保佑你"
            ],
            20: [
                "🚫 今天诸事不宜~快回家睡觉",
                "🤗 桃桃给你一个安慰抱抱",
                "📞 往生堂今日免费咨询~",
                "⏳ 运势不佳~但坏事都会过去的"
            ],
            10: [
                "😭 桃桃都看不下去了...给你加点运气",
                "❗ 今天要特别小心哦",
                "🚪 往生堂大门随时为你敞开",
                "🔮 运势低谷~但明天会转运的"
            ],
            0: [
                "💀 大凶！快让桃桃给你驱邪！",
                "⚰️ 往生堂年度会员资格get√",
                "🛌 今天...还是躺平吧",
                "🍂 我观你今日运势不佳，要不预订…"
            ]
        };

        const range = Math.floor(score / 10) * 10;
        const validRange = range === 100 ? 100 : Math.max(range, 0);
        
        return comments[validRange]?.[Math.floor(Math.random() * comments[validRange].length)] 
               || "🍁 桃桃也看不懂的运势~";
    }
}