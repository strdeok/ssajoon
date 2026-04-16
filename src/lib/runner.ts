import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export interface RunResult {
  stdout: string;
  stderr: string;
  passed: boolean; // refers to successfully executed (exit code 0), NOT if it passed the expected test cases
  error?: string;
}

const TIMEOUT_MS = 3000; // Giving 3 sec for compilation + execution margin

function spawnWithTimeout(
  command: string,
  args: string[],
  stdin: string,
  cwd: string
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd });
    
    let stdout = "";
    let stderr = "";
    let timer: NodeJS.Timeout;

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    timer = setTimeout(() => {
      child.kill("SIGTERM"); // Attempt graceful shutdown
      setTimeout(() => child.kill("SIGKILL"), 100); // Force kill if stuck
      reject(new Error("Execution Timed Out"));
    }, TIMEOUT_MS);
  });
}

export async function runCode(
  language: string,
  code: string,
  input: string
): Promise<RunResult> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "ssajun-run-"));
  
  try {
    if (language === "python") {
      const filePath = path.join(tmpDir, "main.py");
      await fs.writeFile(filePath, code);
      
      const { stdout, stderr, code: exitCode } = await spawnWithTimeout("python3", ["main.py"], input, tmpDir);
      return { stdout, stderr, passed: exitCode === 0 };

    } else if (language === "cpp") {
      const filePath = path.join(tmpDir, "main.cpp");
      await fs.writeFile(filePath, code);
      
      try {
        const compileRes = await spawnWithTimeout("g++", ["main.cpp", "-o", "main"], "", tmpDir);
        if (compileRes.code !== 0) {
          return { stdout: "", stderr: compileRes.stderr, passed: false, error: "Compilation Error" };
        }
      } catch (err: any) {
        return { stdout: "", stderr: err.message, passed: false, error: "Compilation Error" };
      }

      const { stdout, stderr, code: exitCode } = await spawnWithTimeout(path.join(tmpDir, "main"), [], input, tmpDir);
      return { stdout, stderr, passed: exitCode === 0 };

    } else if (language === "java") {
      const filePath = path.join(tmpDir, "Main.java");
      await fs.writeFile(filePath, code);
      
      try {
        const compileRes = await spawnWithTimeout("javac", ["Main.java"], "", tmpDir);
        if (compileRes.code !== 0) {
          return { stdout: "", stderr: compileRes.stderr, passed: false, error: "Compilation Error" };
        }
      } catch (err: any) {
        return { stdout: "", stderr: err.message, passed: false, error: "Compilation Error" };
      }

      const { stdout, stderr, code: exitCode } = await spawnWithTimeout("java", ["Main"], input, tmpDir);
      return { stdout, stderr, passed: exitCode === 0 };

    } else {
      throw new Error(`Unsupported language: ${language}`);
    }
  } catch (err: any) {
    return { stdout: "", stderr: err.message, passed: false, error: err.message };
  } finally {
    // Cleanup Temp Directory
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Failure to cleanup shouldn't crash
    }
  }
}
