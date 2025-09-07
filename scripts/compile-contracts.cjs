/**
 * Compile Solidity Contracts
 * Generates ABI and Bytecode for deployment
 */

const fs = require('fs');
const path = require('path');
const solc = require('solc');

function findImports(importPath) {
  // Handle local imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const contractsDir = path.join(__dirname, '..', 'contracts');
    const fullPath = path.resolve(contractsDir, importPath);
    if (fs.existsSync(fullPath)) {
      return { contents: fs.readFileSync(fullPath, 'utf8') };
    }
  }
  return { error: 'File not found' };
}

function compileContract(contractName, contractPath) {
  const source = fs.readFileSync(contractPath, 'utf8');
  
  const input = {
    language: 'Solidity',
    sources: {
      [contractName]: {
        content: source
      }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };
  
  const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
  
  if (output.errors) {
    output.errors.forEach(error => {
      if (error.severity === 'error') {
        console.error('❌ Compilation error:', error.message);
      } else {
        console.warn('⚠️  Warning:', error.message);
      }
    });
    
    if (output.errors.some(e => e.severity === 'error')) {
      throw new Error('Compilation failed');
    }
  }
  
  return output.contracts[contractName];
}

async function compileAll() {
  console.log('📦 Compiling contracts...\n');
  
  const contractsDir = path.join(__dirname, '..', 'contracts');
  const outputDir = path.join(__dirname, '..', 'artifacts');
  
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Compile MockERC20
  console.log('1️⃣  Compiling MockERC20...');
  const mockERC20 = compileContract('MockERC20.sol', path.join(contractsDir, 'MockERC20.sol'));
  const mockERC20Data = mockERC20['MockERC20'];
  fs.writeFileSync(
    path.join(outputDir, 'MockERC20.json'),
    JSON.stringify({
      abi: mockERC20Data.abi,
      bytecode: '0x' + mockERC20Data.evm.bytecode.object
    }, null, 2)
  );
  console.log('   ✅ MockERC20 compiled');
  
  // Compile SimpleDEX
  console.log('2️⃣  Compiling SimpleLiquidityPool...');
  const simpleDEX = compileContract('SimpleDEX.sol', path.join(contractsDir, 'SimpleDEX.sol'));
  const poolData = simpleDEX['SimpleLiquidityPool'];
  fs.writeFileSync(
    path.join(outputDir, 'SimpleLiquidityPool.json'),
    JSON.stringify({
      abi: poolData.abi,
      bytecode: '0x' + poolData.evm.bytecode.object
    }, null, 2)
  );
  console.log('   ✅ SimpleLiquidityPool compiled');
  
  // Compile MockPool (if needed for testing)
  console.log('3️⃣  Compiling MockAlgebraPool...');
  const mockPool = compileContract('MockPool.sol', path.join(contractsDir, 'MockPool.sol'));
  const mockPoolData = mockPool['MockAlgebraPool'];
  fs.writeFileSync(
    path.join(outputDir, 'MockAlgebraPool.json'),
    JSON.stringify({
      abi: mockPoolData.abi,
      bytecode: '0x' + mockPoolData.evm.bytecode.object
    }, null, 2)
  );
  console.log('   ✅ MockAlgebraPool compiled');
  
  console.log('\n✅ All contracts compiled successfully!');
  console.log('📁 Artifacts saved to:', outputDir);
}

// Check if solc is installed
try {
  require.resolve('solc');
  compileAll().catch(console.error);
} catch (e) {
  console.log('📦 Installing solc compiler...');
  const { execSync } = require('child_process');
  execSync('npm install solc', { stdio: 'inherit' });
  compileAll().catch(console.error);
}