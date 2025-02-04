/* eslint-disable @typescript-eslint/no-var-requires */
const globby = require('globby');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { ESLint } = require('eslint');

(async () => {
  // 查找所有的文档
  const paths = await globby('components/*/index.*.md');
  const components = {};

  paths.forEach(path => {
    const content = fs.readFileSync(path).toString();
    const componentName = path.split('/')[1];

    // 这个文档很怪，居然有硬编码
    if (componentName !== 'color-picker') {
      const { data } = matter(content);
      components[componentName] = { ...components[componentName], ...data };
    }
  });

  // 生成了一个路由
  const TEMPLATE = `
export default [
  ${Object.keys(components).map(
    component => `
  {
    path: '${component}:lang(-cn)?',
    meta: ${JSON.stringify(components[component])},
    component: () => import('../../../components/${component}/demo/index.vue'),
  }`,
  )}
];`;

  // 用 eslint 将代码格式化
  const engine = new ESLint({
    fix: true,
    useEslintrc: false,
    baseConfig: require(path.join(process.cwd(), '.eslintrc.js')),
  });

  const report = await engine.lintText(TEMPLATE);

  fs.writeFileSync('site/src/router/demoRoutes.js', report[0].output);
})();
