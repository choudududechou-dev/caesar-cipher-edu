export interface Task {
  id: number
  type: 'fill' | 'choice' | 'multiChoice' | 'match' | 'writing' | 'flowchart' | 'modern'
  question: string
  options?: string[]
  correctAnswer?: string
  hint?: string
  subjective?: boolean
}

export interface Level {
  id: number
  title: string
  stationName: string
  navImage: string
  bgImage: string
  introText: string
  tasks: Task[]
  passMessage: string
  toolHint?: string
}

export const levels: Level[] = [
  // ==================== 第一关：泉州港 ====================
  {
    id: 1,
    title: '第一站：泉州港 ▪"加密"算法初认识',
    stationName: '泉州港',
    navImage: '/images/nav-quanzhou.png',
    bgImage: '/images/bg-quanzhou.png',
    introText: `<p>同学，欢迎你登录1号商船，我是本次出海的密信大使。在很早以前，聪明的古人早就有了保密绝招，比如虎符阴符、字验、蜡书、拆字、隐字术等，这些方法保护着我们海上丝绸之路的成功航行和贸易。但是听说，你们二十一世纪的数字加密技术更加便捷和安全，而这些技术源自于一种叫凯撒密码的演变，这么神奇的加密方法，让我们一起来探索一下吧。</p>
<p>密信大使在泉州港的灯塔下，拿出一张纸，上面写着：<strong>HELLO → KHOOR</strong></p>`,
    tasks: [
      {
        id: 1,
        type: 'fill',
        question: '观察上表：H→K、E→H、L→O。加密规则是：每个字母向<strong>右</strong>移动 <input-placeholder> 位。',
        correctAnswer: '3',
        hint: '数一数：H(8)到K(11)移动了几位？',
      },
      {
        id: 2,
        type: 'fill',
        question: '如果字母移过了Z怎么办？试一试：X→<input-placeholder>、Y→<input-placeholder>、Z→<input-placeholder>。（提示：Z到头了，从A重新开始！）',
        correctAnswer: 'A,B,C',
        hint: '画一张字母表对照尺：A-B-C-D-...-Z，写两行，第二行从D开始。',
      },
      {
        id: 3,
        type: 'flowchart',
        question: '梳理流程图（按顺序排列）。密信大使给你一张航海图——上面画着加密的操作流程，可惜海上潮湿，羊皮纸有几处被海水泡烂了，流程图的关键步骤看不清楚了。大使说："补全这张图，你才算了解移位加密和解密的思路。"',
        options: ['输入明文', '明文中还有字母未处理？', '向右移动三位', '输出密文', '取下一个字母'],
        correctAnswer: '输入明文,明文中还有字母未处理？,向右移动三位,输出密文,取下一个字母',
      },
    ],
    passMessage: '恭喜！流程图补全了，你学会了凯撒密码的加密步骤。加密和解密就像出海的罗盘——方向相反，但用的是同一张海图。',
    toolHint: '💡 点击右下角 🔐 悬浮按钮打开密码盘，拖动内圈观察字母移位规律；下方还有纸条密码工具帮你理解移位！',
  },

  // ==================== 第二关：广州驿 ====================
  {
    id: 2,
    title: '第二站 广州驿 · 加密解密贸易物品',
    stationName: '广州驿',
    navImage: '/images/nav-guangzhou.png',
    bgImage: '/images/bg-guangzhou.png',
    introText: `<p>泉州商队在广州驿停靠补给。商队要抓紧写一封密信在下一站给交趾译，同时还收到了一封广州驿的密信，商队密信大使邀请你使用刚刚学到的凯撒密码进行加密和解密，来试一试吧。</p>`,
    tasks: [
      {
        id: 1,
        type: 'fill',
        question: '在交趾驿，我们要贸易丝绸，请给"<strong>silk</strong>"这个单词进行加密，密钥和泉州港学的规则一样，加密后的密文是 <input-placeholder>。',
        correctAnswer: 'VLON',
        hint: '回忆一下泉州港学的规则，用密码盘或密码条试试看',
      },
      {
        id: 2,
        type: 'fill',
        question: '广州驿收到一批货，名称已加密（密钥右移3位），密文是<strong>whd</strong>，这批货的明文是什么？<input-placeholder>（提示：加密右移3位，解密就左退3位）',
        correctAnswer: 'TEA',
        hint: 'w→T, h→E, d→A',
      },
      {
        id: 3,
        type: 'choice',
        question: '加密和解密是什么关系？',
        options: [
          '加密和解密用的是完全相同的规则',
          '加密和解密的规则方向相反——加密右移，解密就左退',
          '解密比加密难得多，需要专门的工具才能做',
          '加密有固定规则，解密没有规则，靠猜',
        ],
        correctAnswer: '加密和解密的规则方向相反——加密右移，解密就左退',
      },
      {
        id: 4,
        type: 'fill',
        question: `<p><strong>（选做）挑战题：</strong>用凯撒密码（密钥右移3位），完成以下加密或解密。</p>
<p>① cat（猫）→ 密文：<input-placeholder></p>
<p>② sun（太阳）→ 密文：<input-placeholder></p>
<p>③ bird（鸟）→ 密文：<input-placeholder></p>
<p>④ jrrg（密文）→ 明文：<input-placeholder>（提示：一种食物）</p>
<p>⑤ iurj（密文）→ 明文：<input-placeholder>（提示：一种动物）</p>
<p>✏️ 自选单词：<input-placeholder> → 密文：<input-placeholder></p>`,
        correctAnswer: 'fdw,vxq,elug,good,frog,,',
        subjective: true,
        hint: 'cat→fdw, sun→vxq, bird→elug, jrrg→good, iurj→frog',
      },
    ],
    passMessage: '加密和解密就像出海和返航——用的是同一张海图，方向不同而已。你能做到加密，也能做到解密，才是一个商队真正需要的密信使。',
    toolHint: '💡 点击右上角 🔐 悬浮按钮打开密码盘！加密右移3位就把内圈A对准外圈D，解密就反过来找。',
  },

  // ==================== 第三关：交趾驿 ====================
  {
    id: 3,
    title: '第三站 交趾驿 · 用汉字书写"海上密信"',
    stationName: '交趾驿',
    navImage: '/images/nav-jiaozhi.png',
    bgImage: '/images/bg-jiaozhi.png',
    introText: `<p>商队抵达交趾（今越南）。这里的港口官员不懂英文，泉州商队一直以来都用中文和他们打交道。师傅犯难了："凯撒密码加密的是英文字母，可我们的交易清单和航路报告全都是中文——中文没有字母表，怎么移位？"</p>`,
    tasks: [
      {
        id: 1,
        type: 'fill',
        question: '交趾商人给你一句格言"爱拼才会赢，三分天注定，七分靠打拼"。第一步：根据明文字数确定<strong>方格规格</strong>。这句话共<input-placeholder>个字（不含标点），适合排成 <input-placeholder> 行 × <input-placeholder> 列的方格。',
        correctAnswer: '15,4,4',
        hint: '数一数这句话有多少个字？15个字可以排成什么规格？',
      },
      {
        id: 2,
        type: 'choice',
        question: '中文加密为什么比英文多一步？',
        options: [
          '因为中文比英文更难学',
          '因为中文没有字母表，需要先转换成可移位的形式（如填入表格）',
          '因为中文加密不需要密钥',
          '因为中文加密只能用手写',
        ],
        correctAnswer: '因为中文没有字母表，需要先转换成可移位的形式（如填入表格）',
      },

    ],
    passMessage: '现代中文加密正是这个思路的超级升级版——电脑先把中文字符转换成Unicode编码（每个汉字对应一个数字），再对这个数字进行复杂的数学加密。"先转换，再加密"，你今天在交趾驿发明的这个方法，和全球互联网上保护中文信息的技术在核心思路上完全一致。',
  },

  // ==================== 第四关：马六甲驿 ====================
  {
    id: 4,
    title: '第四站 马六甲驿 · 万国商馆里的"密码博览"',
    stationName: '马六甲驿',
    navImage: '/images/nav-malai.png',
    bgImage: '/images/bg-malai.png',
    introText: `<p>马六甲是海上丝绸之路最大的中转港——阿拉伯人的香料、印度的宝石、波斯的挂毯、中国的瓷器在这里交汇。商队师傅带你走进万国商馆，指着墙上挂着的各种密码文物，说："每个文明都有自己的加密绝活，来，我带你开开眼界！"</p>
<p>在答题之前，先来看看从古至今的密码技术发展史吧——点击每个节点查看详细介绍。</p>
<div class="video-preview-container">
  <video class="level-video" controls autoplay muted preload="metadata">
    <source src="/videos/人类的加密历史.mp4" type="video/mp4">
    您的浏览器不支持视频播放
  </video>
</div>`,
    tasks: [],
    passMessage: '三千年来工具在变、方法在变，但"让信息只被对的人看到"这个目标从未改变。而你，刚刚在四个驿站之间，走完了这三千年的旅程。',
  },

  // ==================== 第五关：波斯湾 ====================
  {
    id: 5,
    title: '第五站：波斯湾 · 商队总部的"终极安全考核"',
    stationName: '波斯湾',
    navImage: '/images/nav-bosi.png',
    bgImage: '/images/bg-bosi.png',
    introText: `<p>历经万里航行，商队终于抵达波斯湾——海上丝绸之路的终点。商队总长亲自迎接你，但他说："最后一个考验——你要通过总部的安全考核，证明你不仅会用加密技术，更懂得什么时候该用、什么时候该防。密信使的真正使命，不是加密本身，而是守护。"</p>`,
    tasks: [
      {
        id: 1,
        type: 'multiChoice',
        question: '【第1题·多选】小杰的爸爸帮他注册了一个学习平台的账号。在设置密码和保护账号方面，以下哪些做法是正确的？',
        options: [
          'A. 用"123456"或"xiaojie2015"做密码，好记',
          'B. 密码用大小写字母+数字+符号混合，比如 XiaoJ@2026!',
          'C. 学习平台、游戏账号、微信都用同一个密码，免得忘记',
          'D. 不同平台用不同密码，定期更换',
          'E. 如果有人向你索要账号密码（哪怕说是"客服"或"老师"），先告诉家长再处理',
        ],
        correctAnswer: 'B,D,E',
      },
      {
        id: 2,
        type: 'choice',
        question: '【第2题·单选】你在波斯湾的集市上，看到免费的"Wi-Fi"信号，你在连接公共Wi-Fi时，绝对不能做的是？',
        options: [
          'A. 刷一刷新闻资讯',
          'B. 登录网上银行转账',
          'C. 看几分钟短视频',
          'D. 下载免费地图',
        ],
        correctAnswer: 'B. 登录网上银行转账',
      },
      {
        id: 3,
        type: 'multiChoice',
        question: '【第3题·多选】商队总长对你说了一段话，请你判断以下哪些说法是正确的？',
        options: [
          'A. 加密可以把明文变成密文，保护信息在传递途中不被外人看懂',
          'B. 凯撒密码虽然简单，但它是现代所有加密技术的思想源头',
          'C. 从烽火狼烟到字母移位再到数字加密，保护信息安全的初衷从未改变',
          'D. 加密规则（密钥）的保密，比加密方法本身更重要',
          'E. 加密技术是大人和专家的事，和孩子没什么关系',
        ],
        correctAnswer: 'A,B,C,D',
      },
      {
        id: 4,
        type: 'multiChoice',
        question: '【第4题·多选】商队严禁把"字验密码本"随便给人看。在数字世界，以下哪些个人信息属于"密信"，不能随意在网上晒？',
        options: [
          'A. 身份证号和护照号码',
          'B. 家门钥匙和家庭住址',
          'C. 喜欢的明星和球鞋',
          'D. 爸爸妈妈的银行卡号和验证码',
        ],
        correctAnswer: 'A,B,D',
      },
      {
        id: 5,
        type: 'choice',
        question: '【第5题·单选】商队总长说："加密技术是用来保护货物的，不是用来藏赃物的。"作为数字小公民，我们应该？',
        options: [
          'A. 用加密软件传播盗版游戏和电影',
          'B. 利用技术漏洞攻击别人的电脑',
          'C. 用加密技术保护自己的隐私，同时遵守法律',
          'D. 在网上匿名辱骂他人，反正没人知道我是谁',
        ],
        correctAnswer: 'C. 用加密技术保护自己的隐私，同时遵守法律',
      },
    ],
    passMessage: '千年来烽火台倒了，密码棒朽了，凯撒密码也早就被破解了——但人类想要安全地传递信息的心，从来没有变过。你今天学会的，是这份传承了几千年的安全智慧。',
  },
]
