const { execSync, spawn } = require('child_process');
const path = require('path');

function cleanPort3000() {
  try {
    if (process.platform === 'win32') {
      const psCommand = [
        '$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1',
        'if ($conn) { Stop-Process -Id $conn.OwningProcess -Force }',
      ].join('; ');

      execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`,
        { stdio: 'ignore' },
      );
      return;
    }

    execSync('lsof -ti tcp:3000 | xargs -r kill -9', {
      stdio: 'ignore',
      shell: true,
    });
  } catch {
    // Ignore cleanup failures to avoid blocking backend startup.
  }
}

function startNest() {
  const nestCli = path.join(
    process.cwd(),
    'node_modules',
    '@nestjs',
    'cli',
    'bin',
    'nest.js',
  );

  const child = spawn(process.execPath, [nestCli, 'start'], {
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error('Failed to start NestJS:', error.message);
    process.exit(1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

cleanPort3000();
startNest();
