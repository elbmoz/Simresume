import { useState, useMemo } from "react";
import { useTranslations } from "@/i18n/compat/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useResumeStore } from "@/store/useResumeStore";
import { useAIConfigStore } from "@/store/useAIConfigStore";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { Streamdown } from "streamdown";
import "streamdown/styles.css";
import { cn } from "@/lib/utils";

type SkillType = 'resume-parser' | 'interview-prep';

interface ScoreResult {
  score: number | null;
  scoreLabel: string;
  advantages: string[];
  gaps: string[];
  rawContent: string;
}

const SmartScorePage = () => {
  const t = useTranslations();
  const { activeResume } = useResumeStore();
  const { selectedModel, doubaoApiKey, doubaoModelId, deepseekApiKey, openaiApiKey, openaiModelId, openaiApiEndpoint, geminiApiKey, geminiModelId } = useAIConfigStore();

  const [selectedSkill, setSelectedSkill] = useState<SkillType>('resume-parser');
  const [jobDescription, setJobDescription] = useState('');
  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resumeText = useMemo(() => {
    if (!activeResume) return '';

    const parts = [];
    const data = activeResume;

    if (data.basic) {
      parts.push(`姓名: ${data.basic.name || ''}`);
      parts.push(`职位: ${data.basic.title || ''}`);
      parts.push(`邮箱: ${data.basic.email || ''}`);
      parts.push(`电话: ${data.basic.phone || ''}`);
    }

    if (data.experience && data.experience.length > 0) {
      parts.push('\n工作经历:');
      data.experience.forEach(exp => {
        parts.push(`- ${exp.company || ''} ${exp.position || ''} (${exp.date || ''})`);
        if (exp.details) parts.push(`  ${exp.details}`);
      });
    }

    if (data.projects && data.projects.length > 0) {
      parts.push('\n项目经历:');
      data.projects.forEach(proj => {
        parts.push(`- ${proj.name || ''} (${proj.date || ''})`);
        if (proj.description) parts.push(`  ${proj.description}`);
      });
    }

    if (data.education && data.education.length > 0) {
      parts.push('\n教育经历:');
      data.education.forEach(edu => {
        parts.push(`- ${edu.school || ''} ${edu.degree || ''} ${edu.major || ''}`);
      });
    }

    if (data.skillContent) {
      parts.push(`\n技能: ${data.skillContent || ''}`);
    }

    return parts.join('\n');
  }, [activeResume]);

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number | null) => {
    if (score === null) return 'bg-gray-100';
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const parseScoreResult = (content: string): ScoreResult => {
    let score = null;
    let scoreLabel = '';
    const advantages: string[] = [];
    const gaps: string[] = [];

    const scoreMatch = content.match(/(\d{1,3})\s*\/\s*100/);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1]);
      scoreLabel = `匹配度: ${score}/100`;
    }

    const lines = content.split('\n');
    let currentSection: 'advantages' | 'gaps' | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('优势') || trimmed.includes('亮点')) {
        currentSection = 'advantages';
      } else if (trimmed.includes('风险') || trimmed.includes('缺口') || trimmed.includes('不足') || trimmed.includes('短板')) {
        currentSection = 'gaps';
      } else if (trimmed.startsWith('##') || trimmed.startsWith('###')) {
        if (trimmed.includes('优势') || trimmed.includes('亮点')) {
          currentSection = 'advantages';
        } else if (trimmed.includes('风险') || trimmed.includes('缺口') || trimmed.includes('不足') || trimmed.includes('短板')) {
          currentSection = 'gaps';
        }
      } else if (trimmed.startsWith('- ') && currentSection) {
        const item = trimmed.slice(2).trim();
        if (currentSection === 'advantages') {
          advantages.push(item);
        } else {
          gaps.push(item);
        }
      }
    });

    return {
      score,
      scoreLabel: scoreLabel || '评分结果',
      advantages: advantages.length > 0 ? advantages : ['暂无优势项'],
      gaps: gaps.length > 0 ? gaps : ['暂无缺口项'],
      rawContent: content
    };
  };

  const buildPrompt = () => {
    const context = [
      `简历内容:\n${resumeText}`,
      jobDescription ? `\n岗位 JD:\n${jobDescription}` : '\n岗位 JD: 未提供'
    ].join('\n');

    if (selectedSkill === 'resume-parser') {
      return [
        '你现在扮演智能简历解析系统，对当前选择的简历和岗位 JD 做严格分析。',
        '必须遵守这些规则：',
        '1. 只能基于提供的简历内容和岗位 JD 分析，不要虚构信息。',
        '2. 先区分 JD 的核心要求和加分要求，核心要求权重 80%，加分要求权重 20%。',
        '3. 评分必须严格，若信息不足要明确写出\'不确定项\'和保守判断。',
        '4. 输出使用 Markdown，包含以下部分：',
        '   - 简历信息摘要',
        '   - JD 核心要求 / 加分要求',
        '   - 匹配度评分（0-100）',
        '   - 优势项',
        '   - 风险与缺口',
        '   - 下一步优化建议',
        '',
        '以下是当前上下文：',
        context,
      ].join('\n');
    } else {
      return [
        '你现在扮演面试题预测助手，为当前选择的简历和岗位 JD 生成面试准备内容。',
        '必须遵守这些规则：',
        '1. 只能基于提供的简历内容和岗位 JD 输出，不要虚构经历。',
        '2. 先给一个简短匹配总结，再输出面试预测内容。',
        '3. 输出使用 Markdown，包含以下部分：',
        '   - 匹配度简述',
        '   - 必问题（5题）',
        '   - 针对性题（5题）',
        '   - 追问题（5题）',
        '   - 每题附简短 STAR 回答提示',
        '   - 最后给一个备考建议清单',
        '',
        '以下是当前上下文：',
        context,
      ].join('\n');
    }
  };

  const callAI = async (prompt: string) => {
    let apiKey = '';
    let modelId = '';
    let baseUrl = '';

    switch (selectedModel) {
      case 'doubao':
        apiKey = doubaoApiKey;
        modelId = doubaoModelId;
        baseUrl = 'https://ark.cn-beijing.volces.com/api/v3';
        break;
      case 'deepseek':
        apiKey = deepseekApiKey;
        modelId = 'deepseek-chat';
        baseUrl = 'https://api.deepseek.com';
        break;
      case 'openai':
        apiKey = openaiApiKey;
        modelId = openaiModelId;
        baseUrl = openaiApiEndpoint;
        break;
      case 'gemini':
        apiKey = geminiApiKey;
        modelId = geminiModelId;
        break;
    }

    if (!apiKey) {
      throw new Error('请先在 AI 服务商设置页配置 API Key');
    }

    if (selectedModel === 'gemini') {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } else {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
  };

  const handleScore = async () => {
    if (!activeResume) {
      setError('请先选择一个简历');
      return;
    }

    setIsScoring(true);
    setError(null);
    setScoreResult(null);

    try {
      const prompt = buildPrompt();
      const result = await callAI(prompt);
      const parsed = parseScoreResult(result);
      setScoreResult(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : '评分失败，请重试');
    } finally {
      setIsScoring(false);
    }
  };

  return (
    <div className="mx-auto py-4 px-4 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          智能评分
        </h1>
        <p className="text-muted-foreground mt-1">
          基于 AI 分析简历与岗位的匹配度，生成专业评分和优化建议
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>选择分析类型</Label>
                <Select
                  value={selectedSkill}
                  onValueChange={(value) => setSelectedSkill(value as SkillType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resume-parser">智能评分</SelectItem>
                    <SelectItem value="interview-prep">面试预测</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>当前简历</Label>
                <div className="p-3 bg-muted rounded-lg">
                  {activeResume ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-medium">{activeResume.title || '未命名简历'}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <AlertCircle className="h-4 w-4" />
                      <span>请先在「我的简历」中选择一个简历</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>岗位 JD（可选）</Label>
                <Textarea
                  placeholder="粘贴岗位描述，让 AI 分析简历与岗位的匹配度..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-red-700 text-sm">{error}</span>
                </div>
              )}

              <Button
                onClick={handleScore}
                disabled={isScoring || !activeResume}
                className="w-full"
              >
                {isScoring ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {selectedSkill === 'resume-parser' ? '开始评分' : '生成面试预测'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {scoreResult && (
            <>
              {scoreResult.score !== null && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>匹配度评分</span>
                      <div
                        className={cn(
                          'text-4xl font-bold',
                          getScoreColor(scoreResult.score)
                        )}
                      >
                        {scoreResult.score}
                        <span className="text-lg text-gray-400">/100</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-1000',
                          getScoreBgColor(scoreResult.score)
                        )}
                        style={{ width: `${scoreResult.score}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {scoreResult.advantages.length > 0 && scoreResult.advantages[0] !== '暂无优势项' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      优势项
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scoreResult.advantages.map((adv, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {scoreResult.gaps.length > 0 && scoreResult.gaps[0] !== '暂无缺口项' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-orange-500" />
                      待改进项
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {scoreResult.gaps.map((gap, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                          <span className="text-sm">{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {scoreResult && (
            <Card>
              <CardHeader>
                <CardTitle>详细分析</CardTitle>
              </CardHeader>
              <CardContent>
                <Streamdown
                  className="prose prose-sm max-w-none dark:prose-invert"
                >
                  {scoreResult.rawContent}
                </Streamdown>
              </CardContent>
            </Card>
          )}

          {!scoreResult && !isScoring && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  选择分析类型并点击开始评分
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export const runtime = "edge";

export default SmartScorePage;
