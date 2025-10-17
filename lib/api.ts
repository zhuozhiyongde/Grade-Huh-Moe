export type ApiResult =
  | ({
      /** 请求是否成功 */
      success: true;
    } & IsopScores)
  | {
      /** 请求是否成功 */
      success: false;

      /** 请求失败原因 */
      errMsg: string;
    };

export type IsopScores = BksScores | YjsScores;

/** 研究生相关 */
export type YjsScores = {
  /** 学生类别：研究生 */
  xslb: "yjs";

  /** 研究生学号 */
  xh: string;

  /** 研究生姓名 */
  xm: string;

  /** 研究生成绩信息列表 */
  scoreLists: Array<{
    /** 学年度 */
    xnd: string;

    /** 学期 */
    xq: string;

    /** 课程号 */
    kch: string;

    /** 课程名称 */
    kcmc: string;

    /** 课程类别 */
    kclb: string;

    /** 学分 */
    xf: string;

    /** 成绩 */
    cj: string;

    /** 成绩记录方式 */
    cjjlfs: string;

    /** 合格标志 */
    hgbz: string;
  }>;
};

/** 本科生相关 */
export type BksScores = {
  /** 学生类别：本科生 */
  xslb: "bks";

  /** 本科生基本信息 */
  jbxx: {
    /** 学号 */
    xh: string;

    /** 系所英文名 */
    xsyw: string;

    /** 姓名 */
    xm: string;

    /** 系所名 */
    xsmc: string;

    /** 专业英文名 */
    zyywmc: string;

    /** 学籍状态 */
    xjzt: string;

    /** 姓名拼音 */
    xmpy: string;

    /** 入学年份 */
    zxnj: string;

    /** 专业名 */
    zymc: string;
  };

  /** 本科生成绩信息 */
  cjxx: Array<{
    /** 学生类别 */
    xslb: string;

    /** 课程执行计划编号 */
    zxjhbh: string;

    /** 教学班号 */
    jxbh: string;

    /** 课程体系码 */
    kctxm: string;

    /** 学期成绩 */
    xqcj: string;

    /** 学期 */
    xq: string;

    /** 课程英文名 */
    ywmc: string;

    /** 授课教师姓名 */
    skjsxm: string;

    /** 授课教师职工号 */
    skjszgh: string;

    /** 学年度 */
    xnd: string;

    /** 绩点 */
    jd: string;

    /** 课程号 */
    kch: string;

    /** 本科成绩编号 */
    bkcjbh: string;

    /** 课程类别名称 */
    kclbmc: string;

    /** 学年度学期全称 */
    xndxqpx: string;

    /** 课程名称 */
    kcmc: string;

    /** 学年度全称 */
    xndpx: string;

    /** 学分 */
    xf: string;

    /** 课程类别 */
    kclb: string;

    /** 课程体系 */
    kctx: string;
  }>;

  /** 本科生转交流成绩信息 */
  zjlcjxx?: object[];

  /** 本科生毕业论文成绩信息 */
  bylwcjxx?: object;

  /** 本科生辅修双学位成绩信息 */
  fscjxx?: object[];

  /** 本科生平均绩点 */
  gpa: {
    /** 通选课学分 */
    txkxf?: string;

    /** 任选学分 */
    rxxf?: string;

    /** 不及格必修课程数 */
    bxxxbjgms?: string;

    /** 计入平均绩点的总学分 */
    zxfgpa?: string;

    /** 平均绩点 */
    gpa: string;

    /** 不及格总学分 */
    bjgzxf?: string;

    /** 总学分 */
    zxf?: string;

    /** 已修课程数 */
    xkms?: string;

    /** 绩点和 */
    jdsum?: string;

    /** 必修学分 */
    bxxf?: string;

    /** ？学分 */
    xxxf?: string;

    /** 绩点 */
    jd?: string;

    /** 限选学分 */
    xzxf?: string;

    /** 不及格课程数 */
    bjgms?: string;

    /** 奖励总学分 */
    jlzxf?: string;
  };

  /** 本科生辅修双学位平均绩点 */
  fsgpa?: {
    /** 平均绩点 */
    fsgpa: string;
  };
};

export type ScoreBase = {
  /** 学年度 */
  xnd: string;

  /** 学期 */
  xq: string;

  /** 课程号 */
  kch: string;

  /** 课程名称 */
  kcmc: string;

  /** 学分 */
  xf: string;

  /** 绩点（仅本科） */
  jd?: string;

  /** 授课教师姓名（仅本科） */
  skjsxm?: string;

  /** 学年度学期全称（仅本科） */
  xndxqpx?: string;
};
