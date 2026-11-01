// Coleta dos eventos do funil para o painel (painel.html). Cada evento vira uma linha
// na planilha do Google, através do Apps Script. Depois de publicar o Apps Script,
// cole a URL do app da Web abaixo — é o único lugar onde ela precisa ser trocada.
(function(){
  const URL_COLETA = 'https://script.google.com/macros/s/AKfycbzePrU66XUDYPbIjMd_LBPS0rAnYNWXq-wTgt2xDIeRaEQdOGfVVBUFU0hylOOVz0jS/exec';
  window.FUNIL_URL = URL_COLETA;

  // Aba anônima ou cookies bloqueados podem derrubar o sessionStorage
  function ler(chave){ try{ return sessionStorage.getItem(chave); }catch(e){ return null; } }
  function gravar(chave, valor){ try{ sessionStorage.setItem(chave, valor); }catch(e){} }

  // A sessão dura enquanto a aba estiver aberta, inclusive na ida para a oferta especial,
  // e é ela que o painel conta: cada pessoa entra uma vez em cada etapa.
  let sessao = ler('funil_sessao');
  if(!sessao){
    sessao = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    gravar('funil_sessao', sessao);
  }

  // A origem é a da primeira página da sessão, para a oferta especial herdar a mesma
  let origem = null;
  try{ origem = JSON.parse(ler('funil_origem')); }catch(e){}
  if(!origem){
    const p = new URLSearchParams(location.search);
    const clique = p.get('gclid') || p.get('gbraid') || p.get('wbraid') ? 'google-ads'
      : p.get('fbclid') ? 'facebook' : 'direto';
    origem = {
      origem: p.get('utm_source') || clique,
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      utm_content: p.get('utm_content') || '',
      utm_term: p.get('utm_term') || ''
    };
    gravar('funil_origem', JSON.stringify(origem));
  }

  const dispositivo = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'celular' : 'computador';

  window.funil = function(evento, extra){
    if(!/^https:\/\//.test(URL_COLETA)) return;
    const corpo = JSON.stringify(Object.assign(
      {evento, sessao, dispositivo, pagina: location.pathname}, origem, extra || {}
    ));
    // sendBeacon continua enviando mesmo quando a página troca logo em seguida
    // (clique no checkout, back redirect)
    if(navigator.sendBeacon && navigator.sendBeacon(URL_COLETA, corpo)) return;
    fetch(URL_COLETA, {method:'POST', body:corpo, mode:'no-cors', keepalive:true}).catch(() => {});
  };
})();
