/**
 * opencode-go settings section.
 *
 * The page is a model manager for the OpenCode Go subscription:
 *  - the provider address is fixed and shown read-only;
 *  - the API key is written to the local credential store (never to config);
 *  - the live model catalog is read from OpenCode Go's public models endpoint;
 *  - each added model stores a context window and a default reasoning effort.
 *
 * DSH's pi-ai adapter has one provider-level reasoning default, so models that
 * choose different defaults are written as separate `opencode-go--<effort>`
 * routes. The page still presents them as one table; the model picker shows
 * the variants as `opencode-go` / `opencode-go · High` groups.
 */

window.__ModuleLoader__.load({
  id: 'dsh-plugin-opencode-go-models',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'opencode-go';
    const PROVIDER_ID = 'opcode-go';
    const SETTINGS_NS = 'llm-pi-ai';
    const KEY_REF = 'OPENCODE_GO_API_KEY';
    const BASE_URL = 'https://opencode.ai/inference/go/openai/v1';
    const MODELS_URL = 'https://opencode.ai/inference/go/v1/models';
    const PRIMARY_ROUTE = 'opcode-go';
    const SECONDARY_PREFIX = 'opcode-go--';
    const DEFAULT_CONTEXT = 1000000;
    const LEGAL_API_KEY = /^[\x21-\x7E]+$/;
    const ENV_LINE = /^[A-Z][A-Z0-9_]*=[^=]/;
    const LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
    const EFFORT_KEYS = {
      standard: 'effortStandard',
      off: 'effortOff',
      minimal: 'effortMinimal',
      low: 'effortLow',
      medium: 'effortMedium',
      high: 'effortHigh',
      xhigh: 'effortXhigh',
      max: 'effortMax',
    };
    const GROUP_LABELS = {
      standard: 'Model default',
      off: 'Off',
      minimal: 'Minimal',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      xhigh: 'Extra high',
      max: 'Max',
    };

    const ZH = {
      meta: {
        title: 'opencode-go 模型',
        description: '使用 API Key 连接 OpenCode Go，拉取实时模型列表，并按上下文窗口和默认思考强度添加模型。',
      },
      nav: 'opencode-go',
      title: 'opencode-go',
      intro: '连接 OpenCode Go。填写 API Key 后即可拉取并添加模型；添加的模型会以 opcode-go 出现在模型选择器中，不会覆盖原生的 opencode-go 供应商。',
      connectionTitle: '连接',
      endpointLabel: '供应商地址',
      endpointHint: 'OpenAI 兼容端点，保存时会自动写入模型配置。',
      copy: '复制',
      copied: '已复制',
      apiKeyLabel: 'API Key',
      apiKeyPlaceholder: '粘贴 OpenCode Go API Key',
      apiKeyHint: '密钥保存在本机凭据库中，不会写入配置文件。留空则保留已保存的密钥。',
      apiKeyStored: '已保存',
      apiKeyMissing: '未保存',
      apiKeyUnknown: '状态未知',
      apiKeyInvalid: 'API Key 只能包含可打印 ASCII 字符，不能有空格或换行。',
      saveForHeader: '检测到旧配置，请点击「保存并应用」完成连接适配。',
      show: '显示',
      hide: '隐藏',
      fetchModels: '获取模型列表',
      fetching: '正在获取…',
      fetchHint: '模型列表来自 OpenCode Go 的公开目录，无需先填写密钥。',
      catalogLoaded: '已获取 {count} 个模型。',
      availableTitle: '可用模型',
      availableCount: '{count} 个',
      availableHint: '选择需要的模型加入下方列表；已添加的模型会显示为“已添加”。',
      searchPlaceholder: '搜索模型名称或 ID',
      add: '添加',
      added: '已添加',
      noModels: '没有找到模型。',
      noReasoning: '无强度档位',
      reasoningChip: '强度：{levels}',
      reasoningLevels: '{count} 档强度',
      configuredTitle: '已添加的模型',
      configuredCount: '{count} 个',
      configuredHint: '为每个模型设置上下文窗口和默认思考强度，然后保存。',
      emptyConfigured: '还没有添加模型。先获取模型列表，再添加需要的模型。',
      columnModel: '模型',
      columnContext: '上下文窗口',
      columnEffort: '默认思考强度',
      columnActions: '操作',
      remove: '删除',
      contextHint: '实际值：{value}',
      groupNote:
        '不同默认思考强度的模型会按强度分组，在模型选择器中显示为 opcode-go / opcode-go · 高强度 等形式。',
      effortNote:
        '默认思考强度会写入供应商路由的 reasoning；保存后点击「检查生效」可查看模型目录实际报告的默认值与可选档位。',
      save: '保存并应用',
      saving: '正在保存…',
      reset: '重置',
      saveHint: '保存后立即生效，无需重启。',
      settingsReadOnly: '当前配置为只读，无法保存。',
      loading: '正在读取配置…',
      retry: '重试',
      loadError: '读取配置失败：{message}',
      fetchError: '获取模型列表失败：{message}',
      saveError: '保存失败：{message}',
      contextInvalid: '「{model}」的上下文窗口必须是正整数。',
      saved: '已保存并应用。',
      savedNoKey: '模型已保存，但还没有可用的 API Key；填入密钥后模型才能使用。',
      resetDone: '已从配置重新读取。',
      verify: '检查生效',
      verifying: '检查中…',
      verifyOk: '模型目录已生效：{details}',
      verifyMissing: '模型目录里还没有这些模型；请先点击“保存并应用”，然后重新打开模型选择器。',
      verifyMissingModel: '未找到',
      verifyError: '检查失败：{message}',
      effortStandard: '模型默认',
      effortOff: '关闭',
      effortMinimal: '极低',
      effortLow: '低',
      effortMedium: '中',
      effortHigh: '高',
      effortXhigh: '极高',
      effortMax: '最高',
    };

    const EN = {
      meta: {
        title: 'opencode-go models',
        description:
          'Connect OpenCode Go with an API key, fetch its live model catalog, and add models with context windows and default reasoning effort.',
      },
      nav: 'opencode-go',
      title: 'opencode-go',
      intro:
        'Connect OpenCode Go. Add your API key, fetch the live catalog, and pick the models you want; added models appear as opcode-go in the picker, separate from the native opencode-go provider.',
      connectionTitle: 'Connection',
      endpointLabel: 'Provider address',
      endpointHint: 'OpenAI-compatible endpoint, written into the model configuration when you save.',
      copy: 'Copy',
      copied: 'Copied',
      apiKeyLabel: 'API key',
      apiKeyPlaceholder: 'Paste your OpenCode Go API key',
      apiKeyHint:
        'The key is stored in the local credential store, never in the configuration file. Leave blank to keep the saved key.',
      apiKeyStored: 'Saved',
      apiKeyMissing: 'Not saved',
      apiKeyUnknown: 'Status unknown',
      apiKeyInvalid: 'The API key may contain only printable ASCII characters, with no spaces or line breaks.',
      saveForHeader: 'An older configuration was detected. Click “Save and apply” once to finish the connection setup.',
      show: 'Show',
      hide: 'Hide',
      fetchModels: 'Fetch models',
      fetching: 'Fetching…',
      fetchHint: "The catalog comes from OpenCode Go's public directory; no key is needed to browse it.",
      catalogLoaded: 'Fetched {count} models.',
      availableTitle: 'Available models',
      availableCount: '{count}',
      availableHint: 'Add the models you need to the list below; models already added show as “Added”.',
      searchPlaceholder: 'Search by model name or ID',
      add: 'Add',
      added: 'Added',
      noModels: 'No models found.',
      noReasoning: 'No effort levels',
      reasoningChip: 'Effort: {levels}',
      reasoningLevels: '{count} levels',
      configuredTitle: 'Added models',
      configuredCount: '{count}',
      configuredHint: 'Set the context window and default reasoning effort for each model, then save.',
      emptyConfigured: 'No models added yet. Fetch the catalog and add the models you need.',
      columnModel: 'Model',
      columnContext: 'Context window',
      columnEffort: 'Default reasoning effort',
      columnActions: 'Actions',
      remove: 'Remove',
      contextHint: 'Effective: {value}',
      groupNote:
        'Models with different default efforts are grouped by effort in the model picker, as opcode-go / opcode-go · High and so on.',
      effortNote:
        'The default effort is written to the route reasoning. After saving, click Check to see the live default and selectable levels reported by the model catalog.',
      save: 'Save and apply',
      saving: 'Saving…',
      reset: 'Reset',
      saveHint: 'Changes take effect immediately; no restart is needed.',
      settingsReadOnly: 'This configuration is read-only and cannot be saved.',
      loading: 'Reading configuration…',
      retry: 'Retry',
      loadError: 'Could not read configuration: {message}',
      fetchError: 'Could not fetch the model catalog: {message}',
      saveError: 'Could not save: {message}',
      contextInvalid: 'The context window for “{model}” must be a positive integer.',
      saved: 'Saved and applied.',
      savedNoKey: 'Models saved, but no API key is available yet; add a key before using them.',
      resetDone: 'Reloaded from configuration.',
      verify: 'Check',
      verifying: 'Checking…',
      verifyOk: 'Model catalog is live: {details}',
      verifyMissing: 'These models are not in the catalog yet; click “Save and apply”, then reopen the model picker.',
      verifyMissingModel: 'not found',
      verifyError: 'Check failed: {message}',
      effortStandard: 'Model default',
      effortOff: 'Off',
      effortMinimal: 'Minimal',
      effortLow: 'Low',
      effortMedium: 'Medium',
      effortHigh: 'High',
      effortXhigh: 'Extra high',
      effortMax: 'Max',
    };

    const CSS = [
      '.ocgo-root{max-width:720px;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}',
      '.ocgo-head{display:flex;align-items:flex-start;gap:10px;min-width:0}',
      '.ocgo-headText{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.ocgo-mark{width:32px;height:32px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:9px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-state-business-primary)}',
      '.ocgo-title{margin:0;font-size:16px;font-weight:500;line-height:24px}',
      '.ocgo-intro{margin:0;color:var(--dsw-alias-label-tertiary);font-size:14px;line-height:22px}',
      '.ocgo-card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:.5px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-1));border-radius:var(--dsw-radius-xl,14px)}',
      '.ocgo-cardHead{display:flex;align-items:center;gap:8px;min-height:20px}',
      '.ocgo-cardTitle{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}',
      '.ocgo-label{font-size:12px;font-weight:500;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.ocgo-field{display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.ocgo-input,.ocgo-select{box-sizing:border-box;width:100%;height:32px;padding:0 10px;border:.5px solid var(--dsw-alias-border-l4,var(--dsw-alias-border-l2));border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;outline:none}',
      '.ocgo-input:focus,.ocgo-select:focus{border-color:var(--dsw-alias-state-business-primary)}',
      '.ocgo-input::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-tertiary))}',
      '.ocgo-select{cursor:pointer;max-width:120px}',
      '.ocgo-endpointRow{display:flex;align-items:center;gap:8px;min-width:0}',
      '.ocgo-endpoint{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:12px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border:.5px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,6px);padding:5px 8px}',
      '.ocgo-keyRow{display:flex;align-items:center;gap:10px;min-width:0}',
      '.ocgo-keyInput{position:relative;flex:1;min-width:0}',
      '.ocgo-keyInput .ocgo-input{padding-right:50px}',
      '.ocgo-keyToggle{position:absolute;right:1px;top:1px;bottom:1px;width:44px;border:none;border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:11px;cursor:pointer}',
      '.ocgo-keyToggle:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.ocgo-keyState{flex:none;display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}',
      '.ocgo-dot{width:8px;height:8px;border-radius:50%;display:inline-block;background:var(--dsw-alias-label-tertiary)}',
      '.ocgo-dot.is-ok{background:var(--dsw-alias-state-success-primary)}',
      '.ocgo-dot.is-missing{background:var(--dsw-alias-state-error-primary)}',
      '.ocgo-hint{margin:0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
      '.ocgo-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
      '.ocgo-btn{box-sizing:border-box;height:32px;padding:0 12px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,8px);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:4px}',
      '.ocgo-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}',
      '.ocgo-btn:disabled{opacity:.5;cursor:default}',
      '.ocgo-btn--primary{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent}',
      '.ocgo-btn--primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}',
      '.ocgo-btn--small{height:28px;padding:0 10px;font-size:12px}',
      '.ocgo-iconBtn{width:28px;height:28px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center}',
      '.ocgo-iconBtn:hover{background:var(--dsw-alias-interactive-bg-hover-danger);color:var(--dsw-alias-state-error-primary)}',
      '.ocgo-count{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;white-space:nowrap}',
      '.ocgo-providerBadge{margin-left:auto;display:inline-flex;align-items:center;padding:1px 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs,4px);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;white-space:nowrap}',
      '.ocgo-toolbar{display:flex;align-items:center;gap:8px}',
      '.ocgo-search{max-width:300px}',
      '.ocgo-catalogList{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;max-height:320px;overflow-y:auto}',
      '.ocgo-catalogRow{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:var(--dsw-radius-md,8px)}',
      '.ocgo-catalogRow:hover{background:var(--dsw-alias-interactive-bg-hover)}',
      '.ocgo-catalogMain{display:flex;flex-direction:column;min-width:0;flex:1}',
      '.ocgo-catalogMeta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;flex:none}',
      '.ocgo-modelName{font-size:13px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ocgo-modelId{font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:11px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ocgo-chip{display:inline-flex;align-items:center;padding:1px 6px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xs,4px);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;white-space:nowrap}',
      '.ocgo-empty{margin:8px 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}',
      '.ocgo-table{width:100%;border-collapse:collapse;table-layout:fixed}',
      '.ocgo-table col.ocgo-wContext{width:120px}',
      '.ocgo-table col.ocgo-wEffort{width:120px}',
      '.ocgo-table col.ocgo-wAction{width:40px}',
      '.ocgo-table th{text-align:left;font-weight:400;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;padding:0 8px 6px 4px;vertical-align:bottom}',
      '.ocgo-table td{padding:8px 8px 8px 4px;border-top:.5px solid var(--dsw-alias-border-l1);vertical-align:top}',
      '.ocgo-table th:last-child,.ocgo-table td:last-child{text-align:right;padding-right:4px}',
      '.ocgo-colModel{display:flex;flex-direction:column;min-width:0}',
      '.ocgo-colContext{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-width:0}',
      '.ocgo-contextInput{max-width:120px}',
      '.ocgo-inputHint{font-size:11px;color:var(--dsw-alias-label-tertiary)}',
      '.ocgo-colEffort{display:flex;flex-direction:column;align-items:flex-start;min-width:0}',
      '.ocgo-colAction{display:flex;justify-content:flex-end;align-items:flex-start}',
      '.ocgo-verifyBtn{margin-left:8px}',
      '.ocgo-footer{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-top:2px}',
      '.ocgo-notice{margin:0;font-size:12px;line-height:18px}',
      '.ocgo-notice--success{color:var(--dsw-alias-state-success-primary)}',
      '.ocgo-notice--error{color:var(--dsw-alias-state-error-primary)}',
      '.ocgo-notice--info{color:var(--dsw-alias-label-secondary)}',
      '.ocgo-muted{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px;margin:0}',
      '.ocgo-error{color:var(--dsw-alias-state-error-primary);font-size:12px;line-height:18px;margin:0}',
      '@media (max-width:560px){.ocgo-table col.ocgo-wContext,.ocgo-table col.ocgo-wEffort{width:100px}.ocgo-table col.ocgo-wAction{width:36px}.ocgo-keyRow{flex-wrap:wrap}.ocgo-keyState{width:100%}}',
    ].join('\n');

    const STYLE_ID = 'dsh-plugin-opencode-go-models/settings';

    function ensureStyle() {
      if (typeof document === 'undefined') return () => {};
      let tag = document.querySelector('style[data-plugin-css="' + STYLE_ID + '"]');
      if (tag === null) {
        tag = document.createElement('style');
        tag.dataset.plugin = 'dsh-plugin-opencode-go-models';
        tag.dataset.pluginCss = STYLE_ID;
        document.head.appendChild(tag);
      }
      if (tag.textContent !== CSS) tag.textContent = CSS;
      return () => {
        tag.remove();
      };
    }

    function isPlainObject(value) {
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    }

    function positiveInt(value) {
      return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;
    }

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    function formatTokens(value) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return '—';
      if (value >= 1000000) {
        const m = value / 1000000;
        return (Number.isInteger(m) ? String(m) : m.toFixed(1)) + 'M';
      }
      if (value >= 1000) {
        const k = value / 1000;
        return (Number.isInteger(k) ? String(k) : k.toFixed(1)) + 'K';
      }
      return String(value);
    }

    function effortLabel(t, key) {
      return t(EFFORT_KEYS[key] ?? 'effortStandard');
    }

    function groupLabel(key) {
      return GROUP_LABELS[key] ?? 'Standard';
    }

    function modalitiesOf(input) {
      if (!Array.isArray(input)) return undefined;
      const result = [];
      if (input.includes('text')) result.push('text');
      if (input.some((value) => typeof value === 'string' && value.startsWith('image/'))) result.push('image');
      return result.length > 0 ? result : undefined;
    }

    function optionsFromEndpoint(reasoning) {
      if (!reasoning || reasoning.supported === false) {
        return { supported: false, levels: [], offWire: undefined };
      }
      const raw = Array.isArray(reasoning.effort) ? reasoning.effort : [];
      const levels = [];
      let offWire;
      for (const value of raw) {
        if (typeof value !== 'string') continue;
        if (value === 'none' || value === 'off') {
          if (!levels.includes('off')) levels.push('off');
          offWire = value;
        } else if (LEVELS.includes(value) && !levels.includes(value)) {
          levels.push(value);
        }
      }
      const ordered = LEVELS.filter((level) => levels.includes(level));
      const declaredDefault =
        reasoning.default && typeof reasoning.default.value === 'string' ? reasoning.default.value : undefined;
      const defaultLevel =
        declaredDefault === 'none'
          ? 'off'
          : declaredDefault !== undefined && LEVELS.includes(declaredDefault)
            ? declaredDefault
            : undefined;
      return { supported: ordered.some((level) => level !== 'off'), levels: ordered, offWire, defaultLevel };
    }

    function optionsFromConfig(model) {
      const declared = model.reasoningEfforts;
      if (declared === false) return { supported: false, levels: [], offWire: undefined };
      if (isPlainObject(declared)) {
        const levels = LEVELS.filter((level) => Object.prototype.hasOwnProperty.call(declared, level));
        let offWire;
        if (levels.includes('off')) {
          const wire = declared.off;
          offWire = typeof wire === 'string' && wire.length > 0 ? wire : null;
        }
        return { supported: levels.some((level) => level !== 'off'), levels, offWire };
      }
      return { supported: true, levels: ['off', 'low', 'medium', 'high', 'max'], offWire: null };
    }

    function defaultEffort(options) {
      if (options.defaultLevel !== undefined && options.levels.includes(options.defaultLevel)) {
        return options.defaultLevel;
      }
      const thinking = options.levels.filter((level) => level !== 'off');
      if (thinking.includes('high')) return 'high';
      if (thinking.includes('max')) return 'max';
      return thinking[thinking.length - 1] ?? 'standard';
    }

    function normalizeCatalogItem(item) {
      if (!isPlainObject(item) || typeof item.id !== 'string' || item.id.length === 0) return undefined;
      if (typeof item.type === 'string' && item.type !== 'chat') return undefined;
      const contextWindow = positiveInt(item.limit && item.limit.context) ?? DEFAULT_CONTEXT;
      const maxTokens = positiveInt(item.limit && item.limit.output);
      const input = modalitiesOf(item.modalities && item.modalities.input);
      const options = optionsFromEndpoint(item.capabilities && item.capabilities.reasoning);
      const name =
        typeof item.name === 'string' && item.name.trim().length > 0 ? item.name.trim() : item.id;
      return { id: item.id, name, contextWindow, maxTokens, input, options };
    }

    function normalizeCatalog(body) {
      const data = Array.isArray(body && body.data)
        ? body.data
        : Array.isArray(body && body.models)
          ? body.models
          : [];
      return data
        .map(normalizeCatalogItem)
        .filter((item) => item !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name, 'en'));
    }

    function catalogSignal() {
      return typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(20000)
        : undefined;
    }

    async function loadCatalogBody() {
      let relayError;
      try {
        const relay = await fetch('/dsh-opencode-go/models', {
          headers: { accept: 'application/json' },
          signal: catalogSignal(),
        });
        if (relay.ok) return await relay.json();
        if (relay.status !== 404) {
          const body = await relay.json().catch(() => null);
          relayError = new Error(body && body.error ? body.error : 'HTTP ' + relay.status);
        }
      } catch (error) {
        relayError = error;
      }
      try {
        const response = await fetch(MODELS_URL, {
          headers: { accept: 'application/json' },
          signal: catalogSignal(),
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return await response.json();
      } catch (error) {
        throw relayError ?? error;
      }
    }

    function effortsFor(options, selected) {
      const map = {};
      for (const level of options.levels) {
        if (level === 'off') {
          map.off = options.offWire === undefined ? null : options.offWire;
        } else {
          map[level] = level;
        }
      }
      if (selected !== 'off' && selected !== 'standard' && map[selected] === undefined) map[selected] = selected;
      return map;
    }

    function keyRefFrom(providers) {
      const primary = providers && providers[PRIMARY_ROUTE];
      const ref = primary && primary.apiKeyEnv;
      return typeof ref === 'string' && ref.trim().length > 0 ? ref.trim() : KEY_REF;
    }

    function readConfiguredRows(providers, userProviders) {
      const rows = [];
      const seen = new Set();
      const routeIds = Object.keys(providers || {})
        .filter((id) => id === PRIMARY_ROUTE || id.startsWith(SECONDARY_PREFIX))
        .sort((a, b) => {
          if (a === PRIMARY_ROUTE) return -1;
          if (b === PRIMARY_ROUTE) return 1;
          return a.localeCompare(b);
        });
      for (const routeId of routeIds) {
        const profile = providers[routeId];
        const models = profile && Array.isArray(profile.models) ? profile.models : [];
        const routeEffort =
          profile && typeof profile.reasoning === 'string' && LEVELS.includes(profile.reasoning)
            ? profile.reasoning
            : undefined;
        for (const model of models) {
          if (!isPlainObject(model) || typeof model.id !== 'string' || seen.has(model.id)) continue;
          seen.add(model.id);
          const options = optionsFromConfig(model);
          let effort = 'standard';
          if (options.supported) {
            if (routeEffort !== undefined && options.levels.includes(routeEffort)) effort = routeEffort;
            else effort = defaultEffort(options);
          }
          rows.push({
            id: model.id,
            name: typeof model.name === 'string' && model.name.length > 0 ? model.name : model.id,
            contextWindow: positiveInt(model.contextWindow) ?? DEFAULT_CONTEXT,
            maxTokens: positiveInt(model.maxTokens),
            input: Array.isArray(model.input)
              ? model.input.filter((value) => value === 'text' || value === 'image')
              : undefined,
            options,
            effort,
            routeId,
          });
        }
      }
      return rows;
    }

    function mergeCatalogRows(rows, catalog) {
      if (!Array.isArray(catalog) || catalog.length === 0) return rows;
      const byId = new Map(catalog.map((item) => [item.id, item]));
      return rows.map((row) => {
        const meta = byId.get(row.id);
        if (meta === undefined) return row;
        const options = meta.options;
        let effort = row.effort;
        if (!options.supported) effort = 'standard';
        else if (!options.levels.includes(effort)) effort = defaultEffort(options);
        return {
          ...row,
          name: meta.name || row.name,
          maxTokens: meta.maxTokens ?? row.maxTokens,
          input: meta.input ?? row.input,
          options,
          effort,
        };
      });
    }

    function choosePrimaryKey(groups, defaultModelId, existingEffort) {
      if (typeof defaultModelId === 'string') {
        for (const [key, rows] of groups) {
          if (rows.some((row) => row.id === defaultModelId)) return key;
        }
      }
      if (typeof existingEffort === 'string' && groups.has(existingEffort)) return existingEffort;
      let best = undefined;
      for (const [key, rows] of groups) {
        if (best === undefined || rows.length > groups.get(best).length) best = key;
      }
      return best ?? 'standard';
    }

    function modelEntry(row, key) {
      const entry = {
        id: row.id,
        name: row.name,
        contextWindow: Number(row.contextWindow),
      };
      if (row.maxTokens !== undefined) entry.maxTokens = row.maxTokens;
      if (Array.isArray(row.input) && row.input.length > 0) entry.input = [...row.input];
      entry.reasoningEfforts = key === 'standard' ? false : effortsFor(row.options, row.effort);
      return entry;
    }

    function buildOps(rows, namespace, defaultModelId, keyRef) {
      const providers = (namespace && namespace.value && namespace.value.providers) || {};
      const userProviders = (namespace && namespace.user && namespace.user.providers) || {};
      const userProfile = (routeId) => {
        const profile = userProviders[routeId];
        return isPlainObject(profile) && typeof profile.__jsExpr !== 'string' ? profile : {};
      };
      const ops = [];
      const groups = new Map();
      for (const row of rows) {
        const key = row.options.supported ? row.effort : 'standard';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
      }
      const existingEffort =
        providers[PRIMARY_ROUTE] && typeof providers[PRIMARY_ROUTE].reasoning === 'string'
          ? providers[PRIMARY_ROUTE].reasoning
          : undefined;
      const primaryKey = choosePrimaryKey(groups, defaultModelId, existingEffort);
      const used = new Set();
      for (const [key, group] of groups) {
        const routeId = key === primaryKey ? PRIMARY_ROUTE : SECONDARY_PREFIX + key;
        used.add(routeId);
        const profile = { ...userProfile(routeId) };
        profile.apiKeyEnv = keyRef;
        profile.displayName =
          routeId === PRIMARY_ROUTE
            ? typeof profile.displayName === 'string' && profile.displayName.length > 0
              ? profile.displayName
              : PROVIDER_ID
            : PROVIDER_ID + ' · ' + groupLabel(key);
        profile.api = 'openai-completions';
        profile.baseURL = BASE_URL;
        const existingHeaders =
          isPlainObject(profile.headers) && typeof profile.headers.__jsExpr !== 'string'
            ? profile.headers
            : {};
        // Static fallback: the pi-ai catalog provider adds this header itself,
        // but a hand-declared route does not. The Host listener overrides it
        // with the real Session id when that waterfall reaches the plugin.
        profile.headers = {
          ...existingHeaders,
          'x-opencode-session': 'dsh-opencode-go:' + routeId,
        };
        if (key === 'standard') delete profile.reasoning;
        else profile.reasoning = key;
        profile.models = group.map((row) => modelEntry(row, key));
        ops.push({ op: 'set', path: ['providers', routeId], value: profile });
      }
      const stale = new Set();
      for (const routeId of Object.keys(providers)) {
        if (routeId.startsWith(SECONDARY_PREFIX) && !used.has(routeId)) stale.add(routeId);
      }
      for (const routeId of Object.keys(userProviders)) {
        if (routeId.startsWith(SECONDARY_PREFIX) && !used.has(routeId)) stale.add(routeId);
      }
      for (const routeId of stale) ops.push({ op: 'unset', path: ['providers', routeId] });
      if (rows.length === 0) {
        // A hand-declared route with no models is invalid. Removing the whole
        // opcode-go route is the only valid empty state; the native
        // opencode-go route is never touched.
        if (providers[PRIMARY_ROUTE] !== undefined || userProviders[PRIMARY_ROUTE] !== undefined) {
          ops.push({ op: 'unset', path: ['providers', PRIMARY_ROUTE] });
        }
      }
      return ops;
    }

    function initialState() {
      return {
        status: 'loading',
        error: null,
        writable: true,
        revision: undefined,
        namespace: undefined,
        models: [],
        catalog: [],
        catalogStatus: 'idle',
        catalogError: null,
        query: '',
        keyRef: KEY_REF,
        keyConfigured: null,
        keyInput: '',
        showKey: false,
        defaultModelId: undefined,
        saving: false,
        verifying: false,
        notice: null,
      };
    }

    function NavIcon(props) {
      const size = props && typeof props.size === 'number' && props.size > 0 ? props.size : 16;
      return h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          'aria-hidden': true,
          style: { display: 'block' },
        },
        h('path', {
          d: 'M3 4.5 6.5 8 3 11.5',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M8.5 11.5H13',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
        }),
      );
    }

    function TrashIcon() {
      return h(
        'svg',
        { viewBox: '0 0 16 16', width: 16, height: 16, 'aria-hidden': true },
        h('path', {
          fill: 'currentColor',
          d: 'M6.2 2h3.6l.5 1H13v1.2H3V3h2.7l.5-1zM4.2 5h7.6l-.6 8.2a1 1 0 0 1-1 .8H5.8a1 1 0 0 1-1-.8L4.2 5zm2.1 1.5.3 6h1l-.2-6h-1.1zm2.3 0-.2 6h1l.3-6H8.6z',
        }),
      );
    }

    function OpenCodeGoSection(props) {
      const t = props.t;
      const remote = props.remote;
      const [state, setState] = React.useState(initialState);
      const [copied, setCopied] = React.useState(false);
      const copyTimer = React.useRef(undefined);

      const load = React.useCallback(
        async (keepNotice) => {
          setState((current) => ({ ...current, status: 'loading', error: null }));
          try {
            const desc = await remote.settings.describe();
            if (!desc || desc.ok !== true) {
              throw new Error(desc && desc.error ? desc.error.message : 'settings describe failed');
            }
            const namespaces = Array.isArray(desc.value.namespaces) ? desc.value.namespaces : [];
            const namespace = namespaces.find((entry) => entry.ns === SETTINGS_NS);
            if (namespace === undefined) {
              throw new Error('missing settings namespace ' + SETTINGS_NS);
            }
            const providers = (namespace.value && namespace.value.providers) || {};
            const userProviders = (namespace.user && namespace.user.providers) || {};
            const keyRef = keyRefFrom(providers);
            const cred = await remote.credentials.describe([keyRef]).catch(() => null);
            const credential = cred && cred.ok === true && cred.value ? cred.value[keyRef] : undefined;
            const keyConfigured =
              cred && cred.ok === true
                ? credential !== undefined && credential.configured === true
                : null;
            const definition = namespaces.find((entry) => entry.ns === 'agent-default-model');
            const definitionProvider = definition && definition.value ? definition.value.provider : undefined;
            const definitionModel = definition && definition.value ? definition.value.model : undefined;
            const defaultModelId =
              (definitionProvider === PRIMARY_ROUTE ||
                (typeof definitionProvider === 'string' && definitionProvider.startsWith(SECONDARY_PREFIX))) &&
              typeof definitionModel === 'string'
                ? definitionModel
                : undefined;
            const rows = readConfiguredRows(providers, userProviders);
            const needsHeader = Object.entries(providers).some(([routeId, profile]) => {
              if (routeId !== PRIMARY_ROUTE && !routeId.startsWith(SECONDARY_PREFIX)) return false;
              const models = profile && Array.isArray(profile.models) ? profile.models : [];
              return (
                models.length > 0 &&
                !(
                  isPlainObject(profile.headers) &&
                  typeof profile.headers['x-opencode-session'] === 'string' &&
                  profile.headers['x-opencode-session'].length > 0
                )
              );
            });
            setState((current) => ({
              ...current,
              status: 'ready',
              error: null,
              writable: desc.value.writable === true,
              revision: namespace.revision,
              namespace,
              models: mergeCatalogRows(rows, current.catalog),
              keyRef,
              keyConfigured,
              defaultModelId,
              notice:
                keepNotice === true
                  ? current.notice
                  : needsHeader
                    ? { tone: 'info', text: t('saveForHeader') }
                    : null,
            }));
          } catch (error) {
            setState((current) => ({
              ...current,
              status: 'error',
              error: messageOf(error),
            }));
          }
        },
        [remote],
      );

      React.useEffect(() => {
        load(false);
      }, [load]);

      React.useEffect(
        () => () => {
          if (copyTimer.current !== undefined) clearTimeout(copyTimer.current);
        },
        [],
      );

      const notify = (tone, text) => {
        setState((current) => ({ ...current, notice: { tone, text } }));
      };

      const fetchCatalog = async () => {
        setState((current) => ({ ...current, catalogStatus: 'loading', catalogError: null }));
        try {
          const body = await loadCatalogBody();
          const catalog = normalizeCatalog(body);
          setState((current) => ({
            ...current,
            catalogStatus: 'ready',
            catalogError: null,
            catalog,
            models: mergeCatalogRows(current.models, catalog),
            notice: { tone: 'info', text: t('catalogLoaded', { count: catalog.length }) },
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            catalogStatus: 'error',
            catalogError: messageOf(error),
          }));
        }
      };

      const addModel = (meta) => {
        setState((current) => {
          if (current.models.some((row) => row.id === meta.id)) return current;
          const effort = meta.options.supported ? defaultEffort(meta.options) : 'standard';
          return {
            ...current,
            models: [
              ...current.models,
              {
                id: meta.id,
                name: meta.name,
                contextWindow: meta.contextWindow ?? DEFAULT_CONTEXT,
                maxTokens: meta.maxTokens,
                input: meta.input,
                options: meta.options,
                effort,
              },
            ],
            notice: null,
          };
        });
      };

      const removeModel = (id) => {
        setState((current) => ({
          ...current,
          models: current.models.filter((row) => row.id !== id),
          notice: null,
        }));
      };

      const updateContext = (id, value) => {
        const digits = value.replace(/[^\d]/g, '');
        setState((current) => ({
          ...current,
          models: current.models.map((row) =>
            row.id === id ? { ...row, contextWindow: digits } : row,
          ),
          notice: null,
        }));
      };

      const updateEffort = (id, effort) => {
        setState((current) => ({
          ...current,
          models: current.models.map((row) => (row.id === id ? { ...row, effort } : row)),
          notice: null,
        }));
      };

      const verifyEffort = async () => {
        if (state.verifying || state.models.length === 0) return;
        setState((current) => ({ ...current, verifying: true, notice: null }));
        try {
          const response = await remote.session.modelCatalog();
          if (!response || response.ok !== true) {
            throw new Error(response && response.error ? response.error.message : 'model catalog failed');
          }
          const groups =
            response.value && Array.isArray(response.value.groups) ? response.value.groups : [];
          const ours = groups.filter(
            (group) => group.id === PRIMARY_ROUTE || group.id.startsWith(SECONDARY_PREFIX),
          );
          let foundAny = false;
          const details = [];
          for (const row of state.models) {
            let found;
            for (const group of ours) {
              const models = Array.isArray(group.models) ? group.models : [];
              const model = models.find((candidate) => candidate.id === row.id);
              if (model !== undefined) {
                found = model;
                break;
              }
            }
            if (found === undefined) {
              details.push(row.name + ': ' + t('verifyMissingModel'));
              continue;
            }
            foundAny = true;
            const reasoning = found.reasoning;
            if (!reasoning) {
              details.push(row.name + ': ' + t('effortStandard'));
              continue;
            }
            const levels = Array.isArray(reasoning.efforts) ? reasoning.efforts : [];
            const levelName = (id) => {
              const match = levels.find((level) => level.id === id);
              return match ? match.name || match.id : id;
            };
            const names = levels.map((level) => level.name || level.id).join(' / ');
            const def = reasoning.defaultEffort
              ? levelName(reasoning.defaultEffort)
              : t('effortStandard');
            details.push(row.name + ': ' + def + (names ? ' (' + names + ')' : ''));
          }
          setState((current) => ({
            ...current,
            verifying: false,
            notice: foundAny
              ? { tone: 'info', text: t('verifyOk', { details: details.join('; ') }) }
              : { tone: 'error', text: t('verifyMissing') },
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            verifying: false,
            notice: { tone: 'error', text: t('verifyError', { message: messageOf(error) }) },
          }));
        }
      };

      const save = async () => {
        if (state.saving) return;
        if (!state.writable) {
          notify('error', t('settingsReadOnly'));
          return;
        }
        const normalized = state.models.map((row) => {
          let effort = row.effort;
          if (!row.options.supported) effort = 'standard';
          else if (!row.options.levels.includes(effort)) effort = defaultEffort(row.options);
          return { ...row, effort };
        });
        for (const row of normalized) {
          const context = Number(row.contextWindow);
          if (!Number.isInteger(context) || context <= 0) {
            notify('error', t('contextInvalid', { model: row.name }));
            return;
          }
        }
        const key = state.keyInput.trim();
        if (key.length > 0 && (!LEGAL_API_KEY.test(key) || ENV_LINE.test(key))) {
          notify('error', t('apiKeyInvalid'));
          return;
        }
        setState((current) => ({ ...current, saving: true, notice: null }));
        try {
          if (key.length > 0) {
            const credential = await remote.credentials.set(state.keyRef, key);
            if (!credential || credential.ok !== true) {
              throw new Error(credential && credential.error ? credential.error.message : 'credential write failed');
            }
          }
          const ops = buildOps(normalized, state.namespace, state.defaultModelId, state.keyRef);
          let namespace = state.namespace;
          if (ops.length > 0) {
            const response = await remote.settings.mutate(SETTINGS_NS, ops, state.revision);
            if (!response || response.ok !== true) {
              throw new Error(response && response.error ? response.error.message : 'settings write failed');
            }
            namespace = response.value;
          }
          const providers = (namespace && namespace.value && namespace.value.providers) || {};
          const userProviders = (namespace && namespace.user && namespace.user.providers) || {};
          const rows = readConfiguredRows(providers, userProviders);
          const hasKey = key.length > 0 || state.keyConfigured === true;
          setState((current) => ({
            ...current,
            saving: false,
            status: 'ready',
            namespace,
            revision: namespace && namespace.revision !== undefined ? namespace.revision : current.revision,
            models: mergeCatalogRows(rows, current.catalog),
            keyRef: keyRefFrom(providers),
            keyConfigured: key.length > 0 ? true : current.keyConfigured,
            keyInput: '',
            notice: hasKey
              ? { tone: 'success', text: t('saved') }
              : { tone: 'info', text: t('savedNoKey') },
          }));
        } catch (error) {
          setState((current) => ({
            ...current,
            saving: false,
            notice: { tone: 'error', text: t('saveError', { message: messageOf(error) }) },
          }));
        }
      };

      const reset = () => {
        setState((current) => ({ ...current, keyInput: '', showKey: false, notice: null }));
        load(false);
      };

      const copyEndpoint = () => {
        const clipboard = typeof navigator !== 'undefined' ? navigator.clipboard : undefined;
        if (!clipboard || typeof clipboard.writeText !== 'function') {
          notify('info', BASE_URL);
          return;
        }
        clipboard.writeText(BASE_URL).then(
          () => {
            setCopied(true);
            if (copyTimer.current !== undefined) clearTimeout(copyTimer.current);
            copyTimer.current = setTimeout(() => setCopied(false), 1500);
          },
          () => notify('info', BASE_URL),
        );
      };

      const query = state.query.trim().toLowerCase();
      const added = new Set(state.models.map((row) => row.id));
      const filteredCatalog = state.catalog.filter(
        (meta) =>
          query.length === 0 ||
          meta.name.toLowerCase().includes(query) ||
          meta.id.toLowerCase().includes(query),
      );
      const keyState =
        state.keyConfigured === true ? 'is-ok' : state.keyConfigured === false ? 'is-missing' : '';

      if (state.status === 'loading') {
        return h(
          'section',
          { className: 'ocgo-root' },
          h('h2', { className: 'ocgo-title' }, t('title')),
          h('p', { className: 'ocgo-intro' }, t('intro')),
          h('div', { className: 'ocgo-card' }, h('p', { className: 'ocgo-muted' }, t('loading'))),
        );
      }

      if (state.status === 'error') {
        return h(
          'section',
          { className: 'ocgo-root' },
          h('h2', { className: 'ocgo-title' }, t('title')),
          h('p', { className: 'ocgo-intro' }, t('intro')),
          h(
            'div',
            { className: 'ocgo-card' },
            h('p', { className: 'ocgo-error' }, t('loadError', { message: state.error })),
            h(
              'div',
              { className: 'ocgo-actions' },
              h(
                'button',
                { type: 'button', className: 'ocgo-btn', onClick: () => load(false) },
                t('retry'),
              ),
            ),
          ),
        );
      }

      return h(
        'section',
        { className: 'ocgo-root' },
        h(
          'header',
          { className: 'ocgo-head' },
          h('div', { className: 'ocgo-mark' }, h(NavIcon, { size: 22 })),
          h(
            'div',
            { className: 'ocgo-headText' },
            h('h2', { className: 'ocgo-title' }, t('title')),
            h('p', { className: 'ocgo-intro' }, t('intro')),
          ),
        ),
        h(
          'div',
          { className: 'ocgo-card' },
          h(
            'div',
            { className: 'ocgo-cardHead' },
            h('span', { className: 'ocgo-cardTitle' }, t('connectionTitle')),
            h('span', { className: 'ocgo-providerBadge' }, PROVIDER_ID),
          ),
          h(
            'div',
            { className: 'ocgo-field' },
            h('span', { className: 'ocgo-label' }, t('endpointLabel')),
            h(
              'div',
              { className: 'ocgo-endpointRow' },
              h('code', { className: 'ocgo-endpoint' }, BASE_URL),
              h(
                'button',
                { type: 'button', className: 'ocgo-btn ocgo-btn--small', onClick: copyEndpoint },
                copied ? t('copied') : t('copy'),
              ),
            ),
            h('p', { className: 'ocgo-hint' }, t('endpointHint')),
          ),
          h(
            'div',
            { className: 'ocgo-field' },
            h('span', { className: 'ocgo-label' }, t('apiKeyLabel')),
            h(
              'div',
              { className: 'ocgo-keyRow' },
              h(
                'div',
                { className: 'ocgo-keyInput' },
                h('input', {
                  className: 'ocgo-input',
                  type: state.showKey ? 'text' : 'password',
                  value: state.keyInput,
                  placeholder: t('apiKeyPlaceholder'),
                  autoComplete: 'new-password',
                  spellCheck: false,
                  onChange: (event) =>
                    setState((current) => ({ ...current, keyInput: event.target.value, notice: null })),
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ocgo-keyToggle',
                    onClick: () => setState((current) => ({ ...current, showKey: !current.showKey })),
                  },
                  state.showKey ? t('hide') : t('show'),
                ),
              ),
              h(
                'span',
                { className: 'ocgo-keyState' },
                h('span', { className: 'ocgo-dot ' + keyState }),
                state.keyConfigured === true
                  ? t('apiKeyStored')
                  : state.keyConfigured === false
                    ? t('apiKeyMissing')
                    : t('apiKeyUnknown'),
              ),
            ),
            h('p', { className: 'ocgo-hint' }, t('apiKeyHint')),
          ),
          h(
            'div',
            { className: 'ocgo-actions' },
            h(
              'button',
              {
                type: 'button',
                className: 'ocgo-btn',
                onClick: fetchCatalog,
                disabled: state.catalogStatus === 'loading',
              },
              state.catalogStatus === 'loading' ? t('fetching') : t('fetchModels'),
            ),
            h('span', { className: 'ocgo-hint' }, t('fetchHint')),
          ),
        ),
        state.catalogStatus === 'idle'
          ? null
          : h(
              'div',
              { className: 'ocgo-card' },
              h(
                'div',
                { className: 'ocgo-cardHead' },
                h('span', { className: 'ocgo-cardTitle' }, t('availableTitle')),
                h(
                  'span',
                  { className: 'ocgo-count' },
                  state.catalogStatus === 'ready'
                    ? t('availableCount', { count: filteredCatalog.length })
                    : '',
                ),
              ),
              h('p', { className: 'ocgo-hint' }, t('availableHint')),
              h(
                'div',
                { className: 'ocgo-toolbar' },
                h('input', {
                  className: 'ocgo-input ocgo-search',
                  value: state.query,
                  placeholder: t('searchPlaceholder'),
                  onChange: (event) => setState((current) => ({ ...current, query: event.target.value })),
                }),
              ),
              state.catalogStatus === 'loading'
                ? h('p', { className: 'ocgo-muted' }, t('fetching'))
                : null,
              state.catalogStatus === 'error'
                ? h('p', { className: 'ocgo-error' }, t('fetchError', { message: state.catalogError }))
                : null,
              state.catalogStatus === 'ready'
                ? filteredCatalog.length === 0
                  ? h('p', { className: 'ocgo-empty' }, t('noModels'))
                  : h(
                      'ul',
                      { className: 'ocgo-catalogList' },
                      filteredCatalog.map((meta) =>
                        h(
                          'li',
                          { key: meta.id, className: 'ocgo-catalogRow' },
                          h(
                            'div',
                            { className: 'ocgo-catalogMain' },
                            h('span', { className: 'ocgo-modelName' }, meta.name),
                            h('code', { className: 'ocgo-modelId' }, meta.id),
                          ),
                          h(
                            'div',
                            { className: 'ocgo-catalogMeta' },
                            h('span', { className: 'ocgo-chip' }, formatTokens(meta.contextWindow)),
                            meta.options.supported
                              ? h(
                                  'span',
                                  { className: 'ocgo-chip' },
                                  t('reasoningLevels', {
                                    count: meta.options.levels.filter((level) => level !== 'off').length,
                                  }),
                                )
                              : h('span', { className: 'ocgo-chip' }, t('noReasoning')),
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'ocgo-btn ocgo-btn--small',
                              disabled: added.has(meta.id),
                              onClick: () => addModel(meta),
                            },
                            added.has(meta.id) ? t('added') : t('add'),
                          ),
                        ),
                      ),
                    )
                : null,
            ),
        h(
          'div',
          { className: 'ocgo-card' },
          h(
            'div',
            { className: 'ocgo-cardHead' },
            h('span', { className: 'ocgo-cardTitle' }, t('configuredTitle')),
            h('span', { className: 'ocgo-count' }, t('configuredCount', { count: state.models.length })),
            h(
              'button',
              {
                type: 'button',
                className: 'ocgo-btn ocgo-btn--small ocgo-verifyBtn',
                onClick: verifyEffort,
                disabled: state.verifying || state.saving || state.models.length === 0,
              },
              state.verifying ? t('verifying') : t('verify'),
            ),
          ),
          h('p', { className: 'ocgo-hint' }, t('configuredHint')),
          state.models.length === 0
            ? h('p', { className: 'ocgo-empty' }, t('emptyConfigured'))
            : h(
                'table',
                { className: 'ocgo-table' },
                h(
                  'colgroup',
                  null,
                  h('col', null),
                  h('col', { className: 'ocgo-wContext' }),
                  h('col', { className: 'ocgo-wEffort' }),
                  h('col', { className: 'ocgo-wAction' }),
                ),
                h(
                  'thead',
                  null,
                  h(
                    'tr',
                    null,
                    h('th', null, t('columnModel')),
                    h('th', null, t('columnContext')),
                    h('th', null, t('columnEffort')),
                    h('th', null, t('columnActions')),
                  ),
                ),
                h(
                  'tbody',
                  null,
                  state.models.map((row) =>
                    h(
                      'tr',
                      { key: row.id },
                      h(
                        'td',
                        null,
                        h(
                          'div',
                          { className: 'ocgo-colModel' },
                          h('span', { className: 'ocgo-modelName' }, row.name),
                          h('code', { className: 'ocgo-modelId' }, row.id),
                        ),
                      ),
                      h(
                        'td',
                        null,
                        h(
                          'div',
                          { className: 'ocgo-colContext' },
                          h('input', {
                            className: 'ocgo-input ocgo-contextInput',
                            inputMode: 'numeric',
                            value: String(row.contextWindow),
                            'aria-label': t('columnContext') + ' ' + row.name,
                            onChange: (event) => updateContext(row.id, event.target.value),
                          }),
                          h(
                            'span',
                            { className: 'ocgo-inputHint' },
                            t('contextHint', { value: formatTokens(Number(row.contextWindow)) }),
                          ),
                        ),
                      ),
                      h(
                        'td',
                        null,
                        h(
                          'div',
                          { className: 'ocgo-colEffort' },
                          row.options.supported
                            ? h(
                                'select',
                                {
                                  className: 'ocgo-select',
                                  value: row.effort,
                                  'aria-label': t('columnEffort') + ' ' + row.name,
                                  onChange: (event) => updateEffort(row.id, event.target.value),
                                },
                                row.options.levels.map((level) =>
                                  h('option', { key: level, value: level }, effortLabel(t, level)),
                                ),
                              )
                            : h('span', { className: 'ocgo-chip' }, t('effortStandard')),
                        ),
                      ),
                      h(
                        'td',
                        null,
                        h(
                          'div',
                          { className: 'ocgo-colAction' },
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'ocgo-iconBtn',
                              title: t('remove'),
                              'aria-label': t('remove') + ' ' + row.name,
                              onClick: () => removeModel(row.id),
                            },
                            h(TrashIcon),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          state.models.length > 0 ? h('p', { className: 'ocgo-hint' }, t('groupNote')) : null,
          state.models.length > 0 ? h('p', { className: 'ocgo-hint' }, t('effortNote')) : null,
        ),
        h(
          'div',
          { className: 'ocgo-footer' },
          h(
            'button',
            {
              type: 'button',
              className: 'ocgo-btn ocgo-btn--primary',
              onClick: save,
              disabled: state.saving || !state.writable,
            },
            state.saving ? t('saving') : t('save'),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'ocgo-btn',
              onClick: reset,
              disabled: state.saving,
            },
            t('reset'),
          ),
          h('span', { className: 'ocgo-hint' }, state.writable ? t('saveHint') : t('settingsReadOnly')),
        ),
        state.notice
          ? h(
              'p',
              {
                className: 'ocgo-notice ocgo-notice--' + state.notice.tone,
                role: 'status',
              },
              state.notice.text,
            )
          : null,
      );
    }

    const inject = ['slots', 'locale', 'remote', 'remote.settings', 'remote.credentials', 'remote.session'];

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, { zh: ZH, en: EN }), 'opencode-go: dictionaries');
      ctx.effect(() => ensureStyle(), 'opencode-go: styles');
      const t = ctx.locale.bind(NS);

      ctx.slots.inject('settings.section', function* () {
        yield ctx.slots.register(
          {
            name: 'settings.section',
            id: 'opencode-go',
            order: 11,
            label: () => t('nav'),
            inject: () => ({ t, remote: ctx.remote }),
          },
          OpenCodeGoSection,
        );
      });

      ctx.slots.inject('settings.section.icon', function* () {
        yield ctx.slots.register({ name: 'settings.section.icon', id: 'opencode-go' }, NavIcon);
      });
    }

    return { name: 'opencode-go', inject, apply };
  },
});
