document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const meusPromptsLink = document.getElementById('meus-prompts-link');
  const marketplaceLink = document.getElementById('marketplace-link');
  const novoPromptBtn = document.getElementById('novo-prompt-btn');

  const meusPromptsSection = document.getElementById('meus-prompts-section');
  const marketplaceSection = document.getElementById('marketplace-section');
  const novoPromptFormSection = document.getElementById('novo-prompt-form-section');

  const searchBar = document.getElementById('search-bar');
  const promptList = document.querySelector('#meus-prompts-section .prompt-list');

  const novoPromptForm = document.getElementById('novo-prompt-form');
  const promptTitleInput = document.getElementById('prompt-title');
  const promptContentInput = document.getElementById('prompt-content');
  const promptFolderInput = document.getElementById('prompt-folder');
  const cancelarNovoPromptBtn = document.getElementById('cancelar-novo-prompt');

  // Initial state
  let prompts = [];
  let folders = {}; // To store prompts organized by folders

  // --- Navigation ---
  function showMeusPrompts() {
    meusPromptsSection.classList.remove('hidden');
    marketplaceSection.classList.add('hidden');
    novoPromptFormSection.classList.add('hidden');
    meusPromptsLink.classList.add('active');
    marketplaceLink.classList.remove('active');
    renderPrompts();
  }

  function showMarketplace() {
    meusPromptsSection.classList.add('hidden');
    marketplaceSection.classList.remove('hidden');
    novoPromptFormSection.classList.add('hidden');
    meusPromptsLink.classList.remove('active');
    marketplaceLink.classList.add('active');
    // TODO: Load marketplace prompts
  }

  function showNovoPromptForm() {
    meusPromptsSection.classList.add('hidden');
    marketplaceSection.classList.add('hidden');
    novoPromptFormSection.classList.remove('hidden');
    promptTitleInput.value = '';
    promptContentInput.value = '';
    promptFolderInput.value = '';
    // Set focus to the first input field for accessibility
    setTimeout(() => promptTitleInput.focus(), 0); // Timeout ensures field is visible before focus
  }

  meusPromptsLink.addEventListener('click', (e) => {
    e.preventDefault();
    showMeusPrompts();
  });

  marketplaceLink.addEventListener('click', (e) => {
    e.preventDefault();
    showMarketplace();
  });

  novoPromptBtn.addEventListener('click', () => {
    showNovoPromptForm();
  });

  cancelarNovoPromptBtn.addEventListener('click', () => {
    showMeusPrompts();
  });

  // --- Prompt Management ---
  async function loadPrompts() {
    try {
      const result = await chrome.storage.local.get(['prompts', 'folders']);
      prompts = result.prompts || [];
      folders = result.folders || {};
      renderPrompts();
    } catch (error) {
      console.error("Error loading prompts:", error);
      // Potentially show an error message to the user in the UI
    }
  }

  async function savePrompts() {
    try {
      await chrome.storage.local.set({ prompts, folders });
    } catch (error) {
      console.error("Error saving prompts:", error);
      // Potentially show an error message to the user in the UI
    }
  }

  function renderPrompts(searchTerm = '') {
    promptList.innerHTML = ''; // Clear existing prompts

    const filteredPrompts = prompts.filter(p =>
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredPrompts.length === 0 && searchTerm === '') {
      promptList.innerHTML = '<p style="padding: 15px; text-align: center; color: #71717A;">Nenhum prompt salvo ainda. Clique em "+ Novo Prompt" para começar.</p>';
      return;
    }
    if (filteredPrompts.length === 0 && searchTerm !== '') {
      promptList.innerHTML = `<p style="padding: 15px; text-align: center; color: #71717A;">Nenhum prompt encontrado para "${searchTerm}".</p>`;
      return;
    }

    filteredPrompts.forEach((prompt) => { // Removed index, will use prompt.id
      const promptElement = document.createElement('div');
      promptElement.classList.add('prompt-item');
      promptElement.dataset.promptId = prompt.id; // Store ID for actions

      let folderDisplay = '';
      if (prompt.folder) {
        folderDisplay = `<span class="prompt-item-folder">(${prompt.folder})</span>`;
      }

      // Ensure prompt.title is defined and escaped for aria-label
      const safeTitle = prompt.title || "este prompt";


      promptElement.innerHTML = `
        <div>
          <span class="prompt-item-title">${prompt.title}</span>
          ${folderDisplay}
        </div>
        <div class="prompt-item-actions">
          <button data-action="copy" title="Copiar prompt" aria-label="Copiar o prompt '${safeTitle}'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button data-action="edit" title="Editar prompt" aria-label="Editar o prompt '${safeTitle}'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
          </button>
          <button data-action="delete" title="Excluir prompt" aria-label="Excluir o prompt '${safeTitle}'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      `;
      promptList.appendChild(promptElement);
    });
  }

  novoPromptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = promptTitleInput.value.trim();
    const content = promptContentInput.value.trim();
    const folderName = promptFolderInput.value.trim();

    if (title && content) {
      const editingId = novoPromptForm.dataset.editingId ? parseInt(novoPromptForm.dataset.editingId) : null;
      let newPromptData = { title, content, folder: folderName || null };

      if (editingId) {
        const promptIndex = prompts.findIndex(p => p.id === editingId);
        if (promptIndex !== -1) {
          // Before updating, handle potential folder changes
          const oldFolder = prompts[promptIndex].folder;
          if (oldFolder && oldFolder !== folderName) {
            // Remove from old folder
            if (folders[oldFolder]) {
              folders[oldFolder] = folders[oldFolder].filter(id => id !== editingId);
              if (folders[oldFolder].length === 0) delete folders[oldFolder];
            }
          }

          prompts[promptIndex] = { ...prompts[promptIndex], ...newPromptData };
        }
        delete novoPromptForm.dataset.editingId;
        novoPromptForm.querySelector('button[type="submit"]').textContent = 'Salvar Prompt';
      } else {
        const newPrompt = { ...newPromptData, id: Date.now() };
        prompts.push(newPrompt);
        // Only add to folder if it's a new prompt; editing handles its own folder logic
        if (folderName) {
          if (!folders[folderName]) {
            folders[folderName] = [];
          }
          // Ensure prompt ID isn't duplicated in folder list (e.g. if editing and keeping same folder)
          if (!folders[folderName].includes(newPrompt.id)) {
             folders[folderName].push(newPrompt.id);
          }
        }
      }
      // Ensure the prompt (identified by editingId) is in the correct folder list
      if (editingId && folderName) {
        if (!folders[folderName]) {
          folders[folderName] = [];
        }
        if (!folders[folderName].includes(editingId)) { // Check if not already there
          folders[folderName].push(editingId);
        }
      }


      await savePrompts();
      showMeusPrompts();
    }
  });

  promptList.addEventListener('click', (e) => {
    const targetButton = e.target.closest('button');
    if (!targetButton) return;

    const action = targetButton.dataset.action;
    const promptItemElement = targetButton.closest('.prompt-item');
    const promptId = parseInt(promptItemElement.dataset.promptId); // Get ID from element

    const promptIndex = prompts.findIndex(p => p.id === promptId);

    if (promptIndex === -1) {
        console.error("Prompt not found for action:", action, "ID:", promptId);
        return;
    }

    const currentPrompt = prompts[promptIndex];

    if (action === 'copy') {
      navigator.clipboard.writeText(currentPrompt.content).then(() => {
        const originalContent = targetButton.innerHTML; // Save original SVG content
        targetButton.textContent = 'Copiado!';
        targetButton.style.width = targetButton.offsetWidth + "px"; // Keep width
        setTimeout(() => {
          targetButton.innerHTML = originalContent; // Restore SVG
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy: ', err);
      });
    } else if (action === 'edit') {
        showNovoPromptForm();
        promptTitleInput.value = currentPrompt.title;
        promptContentInput.value = currentPrompt.content;
        promptFolderInput.value = currentPrompt.folder || '';
        novoPromptForm.dataset.editingId = currentPrompt.id; // Store ID for saving
        novoPromptForm.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
        // Clear editingIndex if it was used before
        delete novoPromptForm.dataset.editingIndex;


    } else if (action === 'delete') {
      if (confirm(`Tem certeza que deseja excluir o prompt "${currentPrompt.title}"?`)) {
        const deletedPrompt = prompts.splice(promptIndex, 1)[0];
        if (deletedPrompt.folder && folders[deletedPrompt.folder]) {
            folders[deletedPrompt.folder] = folders[deletedPrompt.folder].filter(id => id !== deletedPrompt.id);
            if (folders[deletedPrompt.folder].length === 0) {
                delete folders[deletedPrompt.folder];
            }
        }
        savePrompts();
        renderPrompts(searchBar.value); // Re-render with current search term
      }
    }
  });

  searchBar.addEventListener('input', (e) => {
    renderPrompts(e.target.value);
  });


  // --- Marketplace ---
  const sampleMarketplacePrompts = [
    {
      id: 'market-1',
      title: 'Email Profissional para Cliente',
      content: 'Escreva um email profissional para um cliente sobre [ASSUNTO DO EMAIL], mencionando [PONTO CHAVE 1] e [PONTO CHAVE 2]. Finalize com um call to action para [AÇÃO DESEJADA].',
      category: 'Email',
      author: 'Começa AI Team'
    },
    {
      id: 'market-2',
      title: 'Ideias para Post de Blog (Marketing Digital)',
      content: 'Gere 5 ideias criativas para posts de blog sobre o tema de [TEMA PRINCIPAL] com foco em estratégias de marketing digital para pequenas empresas. Inclua sugestões de palavras-chave.',
      category: 'Conteúdo',
      author: 'AI Prompter Pro'
    },
    {
      id: 'market-3',
      title: 'Resumo de Texto Longo',
      content: 'Resuma o seguinte texto em 3 parágrafos curtos, destacando os pontos mais importantes:\n\n[COLE O TEXTO AQUI]',
      category: 'Produtividade',
      author: 'Prompt Masters'
    },
    {
      id: 'market-4',
      title: 'Code Explainer (Python)',
      content: 'Explique o que o seguinte código Python faz, linha por linha, e sugira possíveis melhorias ou casos de uso alternativos:\n\n```python\n[COLE O CÓDIGO PYTHON AQUI]\n```',
      category: 'Desenvolvimento',
      author: 'DevPrompts'
    }
  ];

  function renderMarketplacePrompts() {
    marketplaceSection.innerHTML = '<h2>Marketplace de Prompts</h2>'; // Reset and add title
    const marketplaceList = document.createElement('div');
    marketplaceList.classList.add('prompt-list'); // Reuse existing styling for list

    if (sampleMarketplacePrompts.length === 0) {
      marketplaceList.innerHTML = '<p style="padding: 15px; text-align: center; color: #71717A;">O marketplace está vazio no momento.</p>';
    } else {
      sampleMarketplacePrompts.forEach(prompt => {
        const promptElement = document.createElement('div');
        promptElement.classList.add('prompt-item'); // Reuse existing styling
        promptElement.innerHTML = `
          <div>
            <span class="prompt-item-title">${prompt.title}</span>
            <span class="prompt-item-folder">${prompt.category} (por ${prompt.author})</span>
          </div>
          <div class="prompt-item-actions">
            <button data-action="copy-from-market" data-market-id="${prompt.id}" title="Copiar para Meus Prompts" aria-label="Copiar o prompt do marketplace '${prompt.title || 'este prompt'}' para Meus Prompts">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            </button>
          </div>
        `;
        marketplaceList.appendChild(promptElement);
      });
    }
    marketplaceSection.appendChild(marketplaceList);

    // Add event listener for the "copy-from-market" buttons
    marketplaceList.addEventListener('click', async (e) => {
      const targetButton = e.target.closest('button[data-action="copy-from-market"]');
      if (!targetButton) return;

      const marketId = targetButton.dataset.marketId;
      const promptToCopy = sampleMarketplacePrompts.find(p => p.id === marketId);

      if (promptToCopy) {
        const newPrompt = {
          title: promptToCopy.title,
          content: promptToCopy.content,
          folder: promptToCopy.category || 'Marketplace', // Assign to a default folder
          id: Date.now() // Create a new ID for the user's copy
        };
        prompts.push(newPrompt);
        await savePrompts(); // Save to user's local storage

        // Optional: Give feedback
        const originalButtonContent = targetButton.innerHTML;
        targetButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copiado!`;
        targetButton.disabled = true;
        setTimeout(() => {
          targetButton.innerHTML = originalButtonContent;
          targetButton.disabled = false;
          // Maybe switch to "Meus Prompts" view
          // showMeusPrompts();
        }, 2000);
      }
    });
  }

  function showMarketplace() {
    meusPromptsSection.classList.add('hidden');
    marketplaceSection.classList.remove('hidden');
    novoPromptFormSection.classList.add('hidden');
    meusPromptsLink.classList.remove('active');
    marketplaceLink.classList.add('active');
    renderMarketplacePrompts(); // Render marketplace prompts when shown
  }


  // --- Initialization ---
  loadPrompts(); // Load prompts when the popup opens
  showMeusPrompts(); // Show default view
});
