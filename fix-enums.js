const fs = require('fs');
const path = require('path');

const services = ['auth-service', 'analitica-auditoria-service', 'catalogo-i18n-service', 'comandas-service', 'inventario-service', 'maridaje-service'];

services.forEach(service => {
  const schemaPath = path.join(__dirname, 'services', service, 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    let content = fs.readFileSync(schemaPath, 'utf8');
    
    // Determine the schema name from one of the models
    const schemaMatch = content.match(/@@schema\("([^"]+)"\)/);
    if (schemaMatch) {
      const schemaName = schemaMatch[1];
      
      // Regex to find enums and add @@schema to them if they don't have it
      content = content.replace(/enum\s+\w+\s*\{([^}]+)\}/g, (match, inner) => {
        if (!inner.includes('@@schema')) {
          return match.replace(/(\s*)\}/, `\n  @@schema("${schemaName}")$1}`);
        }
        return match;
      });
      
      fs.writeFileSync(schemaPath, content);
      console.log(`Updated enums in ${service} to schema ${schemaName}`);
    }
  }
});
