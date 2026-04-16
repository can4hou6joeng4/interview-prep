import assert from 'node:assert/strict';
import { slugify, buildQuestionSlug } from './slug.mjs';

// Case 1: 中英混排只提取英文 token
assert.equal(slugify('Goroutine 的调度模型 GMP 是什么？'), 'goroutine-gmp');

// Case 2: 驼峰拆分
assert.equal(slugify('GoroutineGMP'), 'goroutine-gmp');

// Case 3: 连续大写 + 小写串（GMPGoroutine 拆为 gmp goroutine）
assert.equal(slugify('GMPGoroutine'), 'gmp-goroutine');

// Case 4: 仅取前 6 个 token
assert.equal(slugify('A B C D E F G H I J'), 'a-b-c-d-e-f');

// Case 5: 全中文回落为空
assert.equal(slugify('什么是分布式事务？'), '');

// Case 6: 特殊符号被丢弃（C++ → c）
assert.equal(slugify('C++ 的 std::vector 扩容策略'), 'c-std-vector');

// Case 7: buildQuestionSlug 拼接完整 id 兜底
assert.equal(
  buildQuestionSlug('Goroutine 的调度模型 GMP', 'q-q1rk0k'),
  'goroutine-gmp-q-q1rk0k'
);

// Case 8: 全中文题目 buildQuestionSlug 回落为 id
assert.equal(buildQuestionSlug('什么是分布式事务', 'q-abcdef'), 'q-abcdef');

// Case 9: 长度截断保留完整 token，不以连字符结尾
const long = 'Redis caching strategy for distributed microservices architecture deployment pipeline scaling system';
const out = slugify(long);
assert.ok(out.length <= 80, `slug too long: ${out.length}`);
assert.ok(!out.endsWith('-'), `slug ends with dash: ${out}`);

console.log('All slug tests passed.');
