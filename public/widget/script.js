define(['jquery'], function($) {
  var CustomWidget = function() {
    var self = this;
    var callTimerInterval = null;
    var callSeconds = 0;
    var currentCallId = null;
    var currentActivePhone = null;
    var currentContactName = "Contato";
    var currentLeadId = null;
    var currentContactId = null;
    var currentResponsibleId = null;

    function formatTime(sec) {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }

    function formatTimeText(sec) {
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      if (sec === 0) return "0s (Não atendida)";
      if (m === 0) return s + "s";
      return m + "m " + (s > 0 ? s + "s" : "");
    }

    this.callbacks = {
      render: function() {
        return true;
      },
      init: function() {
        return true;
      },
      bind_actions: function() {
        var cardData = AMOCRM.data.current_card;
        if (!cardData) return true;

        currentLeadId = cardData.id || null;
        currentContactName = "Contato";
        var phones = [];

        // Extrair dados do lead/contato
        if (AMOCRM.data.current_card && AMOCRM.data.current_card.model) {
          var model = AMOCRM.data.current_card.model;
          currentContactName = model.get("NAME") || "Contato";
          currentResponsibleId = model.get("RESPONSIBLE_USER_ID") || null;

          var cf = model.get("cf") || [];
          for (var key in cf) {
            var field = cf[key];
            if (field.CODE === "PHONE" || field.NAME === "Telefone") {
              var values = field.VALUES || [];
              for (var i = 0; i < values.length; i++) {
                if (values[i].VALUE) {
                  phones.push(values[i].VALUE);
                }
              }
            }
          }
        }

        // Se for cartão de contato específico
        if (cardData.element_type === "contact" || cardData.element_type === 1) {
          currentContactId = cardData.id;
        }

        // Renderizar container do widget
        var containerId = "kvh_widget_box";
        $("#" + containerId).remove();

        var html = '<div id="' + containerId + '" class="kvh-widget-container">' +
          '<div class="kvh-widget-header">' +
            '<span class="kvh-widget-title">📞 Kommo Zap Call</span>' +
            '<span class="kvh-status-badge">UAZAPI WhatsApp</span>' +
          '</div>';

        if (phones.length === 0) {
          html += '<div class="kvh-warning">Nenhum telefone encontrado neste lead.</div>';
        } else if (phones.length === 1) {
          html += '<div class="kvh-phone-info">Telefone: <strong>' + phones[0] + '</strong></div>' +
            '<button id="kvh_btn_call" class="kvh-call-button" data-phone="' + phones[0] + '">' +
              '<span>Ligar pelo WhatsApp</span>' +
            '</button>';
        } else {
          html += '<div class="kvh-phone-info">Selecione o telefone:</div>' +
            '<select id="kvh_phone_select" class="kvh-phone-select">';
          for (var p = 0; p < phones.length; p++) {
            html += '<option value="' + phones[p] + '">' + phones[p] + '</option>';
          }
          html += '</select>' +
            '<button id="kvh_btn_call_multi" class="kvh-call-button">Ligar pelo WhatsApp</button>';
        }

        // Card de chamada em andamento
        html += '<div id="kvh_call_live_area" style="display: none;" class="kvh-call-live">' +
          '<div><span class="kvh-pulse-indicator"></span><span id="kvh_status_text" style="font-size: 12px; font-weight: 600; color: #047857;">Chamando via WhatsApp...</span></div>' +
          '<div id="kvh_timer" class="kvh-timer">00:00</div>' +
          '<button id="kvh_btn_hangup" class="kvh-hangup-button">🔴 Encerrar Chamada</button>' +
        '</div>';

        html += '</div>';

        $(".card-widgets__body, .linked-forms__body").first().prepend(html);

        // Disparo de Chamada
        function triggerCall(selectedPhone) {
          currentActivePhone = selectedPhone;
          var btn = $("#kvh_btn_call, #kvh_btn_call_multi");
          btn.prop("disabled", true).text("Iniciando chamada...");

          var settings = self.get_settings();
          var appUrl = (settings.app_url || "http://localhost:3000").replace(/\/+$/, "");

          $.ajax({
            url: appUrl + "/api/calls",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              phone: selectedPhone,
              contactName: currentContactName,
              leadId: currentLeadId,
              contactId: currentContactId,
              provider: "uazapi",
              apiKey: settings.api_key || null,
              subdomain: (window.AMOCRM && window.AMOCRM.constant && window.AMOCRM.constant("account")) ? window.AMOCRM.constant("account").subdomain : null
            }),
            success: function(res) {
              btn.hide();
              $("#kvh_call_live_area").show();
              $("#kvh_status_text").text("Em chamada WhatsApp");

              if (res.call && res.call.id) {
                currentCallId = res.call.id;
              }

              // Iniciar cronômetro
              callSeconds = 0;
              clearInterval(callTimerInterval);
              callTimerInterval = setInterval(function() {
                callSeconds++;
                $("#kvh_timer").text(formatTime(callSeconds));
              }, 1000);
            },
            error: function(err) {
              btn.prop("disabled", false).text("Ligar pelo WhatsApp");
              var msg = (err.responseJSON && err.responseJSON.error) ? err.responseJSON.error : "Falha ao conectar com o servidor";
              alert("Erro ao disparar chamada WhatsApp: " + msg);
            }
          });
        }

        // Abertura do Popup Modal de Feedback
        function openFeedbackModal() {
          clearInterval(callTimerInterval);
          $("#kvh_call_live_area").hide();
          $("#kvh_btn_call, #kvh_btn_call_multi").show().prop("disabled", false).text("Ligar pelo WhatsApp");

          $("#kvh_modal_overlay").remove();

          var durationStr = formatTime(callSeconds);
          var durationLabel = formatTimeText(callSeconds);

          var modalHtml = '<div id="kvh_modal_overlay" class="kvh-modal-overlay">' +
            '<div class="kvh-modal-card">' +
              '<div class="kvh-modal-header">' +
                '<span class="kvh-modal-title">📞 Resultado da Chamada WhatsApp</span>' +
                '<button type="button" class="kvh-modal-close" id="kvh_modal_btn_close">✕</button>' +
              '</div>' +
              '<div class="kvh-modal-body">' +
                '<div id="kvh_modal_alert" style="display: none;"></div>' +
                '<div class="kvh-call-summary-box">' +
                  '<div>' +
                    '<div class="kvh-summary-lead-name">' + (currentContactName || "Lead") + '</div>' +
                    '<div class="kvh-summary-lead-phone">' + (currentActivePhone || "") + '</div>' +
                  '</div>' +
                  '<div class="kvh-duration-badge">⏱ ' + durationStr + '</div>' +
                '</div>' +

                '<label class="kvh-section-label">Como foi o resultado desta ligação?</label>' +
                '<div class="kvh-feedback-options">' +
                  '<div class="kvh-feedback-option" data-value="lead_nao_atendeu">' +
                    '<span class="kvh-feedback-emoji">📵</span>' +
                    '<div class="kvh-feedback-text-wrap">' +
                      '<div class="kvh-feedback-title">Lead não atendeu</div>' +
                      '<div class="kvh-feedback-subtitle">Chamou até cair, caixa postal ou ocupado</div>' +
                    '</div>' +
                  '</div>' +

                  '<div class="kvh-feedback-option" data-value="call_negativa">' +
                    '<span class="kvh-feedback-emoji">👎</span>' +
                    '<div class="kvh-feedback-text-wrap">' +
                      '<div class="kvh-feedback-title">Call foi negativa</div>' +
                      '<div class="kvh-feedback-subtitle">Sem interesse, momento ruim ou objeção insuperável</div>' +
                    '</div>' +
                  '</div>' +

                  '<div class="kvh-feedback-option active-positive" data-value="call_positiva">' +
                    '<span class="kvh-feedback-emoji">🟢</span>' +
                    '<div class="kvh-feedback-text-wrap">' +
                      '<div class="kvh-feedback-title">Call foi positiva</div>' +
                      '<div class="kvh-feedback-subtitle">Contato interessado, agendado ou proposta em andamento</div>' +
                    '</div>' +
                  '</div>' +
                '</div>' +

                '<label class="kvh-section-label">Observações adicionais (opcional):</label>' +
                '<textarea id="kvh_notes_input" class="kvh-notes-textarea" placeholder="Ex: Pediu para retornar amanhã às 14h com a proposta revisada..."></textarea>' +
              '</div>' +

              '<div class="kvh-modal-footer">' +
                '<button type="button" class="kvh-btn-cancel" id="kvh_modal_btn_cancel">Cancelar</button>' +
                '<button type="button" class="kvh-btn-save" id="kvh_modal_btn_save">💾 Salvar Tarefa no Kommo</button>' +
              '</div>' +
            '</div>' +
          '</div>';

          $("body").append(modalHtml);
        }

        // Seleção das opções no modal
        $(document).off("click", ".kvh-feedback-option").on("click", ".kvh-feedback-option", function() {
          $(".kvh-feedback-option").removeClass("active-no-answer active-negative active-positive");
          var val = $(this).data("value");
          if (val === "lead_nao_atendeu") {
            $(this).addClass("active-no-answer");
          } else if (val === "call_negativa") {
            $(this).addClass("active-negative");
          } else {
            $(this).addClass("active-positive");
          }
        });

        // Salvar Tarefa no Kommo com Feedback e Duração
        $(document).off("click", "#kvh_modal_btn_save").on("click", "#kvh_modal_btn_save", function() {
          var btn = $(this);
          var selectedOption = $(".kvh-feedback-option.active-no-answer, .kvh-feedback-option.active-negative, .kvh-feedback-option.active-positive");
          var feedbackVal = selectedOption.data("value") || "call_positiva";
          var noteVal = $("#kvh_notes_input").val();

          btn.prop("disabled", true).text("Salvando no Kommo...");

          var settings = self.get_settings();
          var appUrl = (settings.app_url || "http://localhost:3000").replace(/\/+$/, "");

          $.ajax({
            url: appUrl + "/api/calls/feedback",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              callId: currentCallId,
              leadId: currentLeadId,
              contactId: currentContactId,
              phone: currentActivePhone,
              durationSeconds: callSeconds,
              feedback: feedbackVal,
              note: noteVal,
              responsibleUserId: currentResponsibleId,
              apiKey: settings.api_key || null,
              subdomain: (window.AMOCRM && window.AMOCRM.constant && window.AMOCRM.constant("account")) ? window.AMOCRM.constant("account").subdomain : null
            }),
            success: function(res) {
              $("#kvh_modal_alert")
                .html('<div class="kvh-alert-success">✅ Tarefa de ligação registrada no Kommo com sucesso!</div>')
                .show();

              btn.text("Salvo com sucesso!");

              setTimeout(function() {
                $("#kvh_modal_overlay").fadeOut(250, function() {
                  $(this).remove();
                });
                // Recarregar os dados do cartão do Kommo se a função estiver disponível
                if (window.AMOCRM && window.AMOCRM.router && typeof window.AMOCRM.router.reload === "function") {
                  window.AMOCRM.router.reload();
                }
              }, 1200);
            },
            error: function(err) {
              btn.prop("disabled", false).text("💾 Salvar Tarefa no Kommo");
              var msg = (err.responseJSON && err.responseJSON.error) ? err.responseJSON.error : "Erro ao salvar no Kommo";
              alert("Erro ao registrar no Kommo: " + msg);
            }
          });
        });

        // Fechar modal sem salvar
        $(document).off("click", "#kvh_modal_btn_close, #kvh_modal_btn_cancel").on("click", "#kvh_modal_btn_close, #kvh_modal_btn_cancel", function() {
          $("#kvh_modal_overlay").fadeOut(200, function() {
            $(this).remove();
          });
        });

        // Eventos de clique dos botões do widget
        $(document).off("click", "#kvh_btn_call").on("click", "#kvh_btn_call", function() {
          triggerCall($(this).data("phone"));
        });

        $(document).off("click", "#kvh_btn_call_multi").on("click", "#kvh_btn_call_multi", function() {
          var sel = $("#kvh_phone_select").val();
          triggerCall(sel);
        });

        $(document).off("click", "#kvh_btn_hangup").on("click", "#kvh_btn_hangup", function() {
          if (currentCallId) {
            var settings = self.get_settings();
            var appUrl = (settings.app_url || "http://localhost:3000").replace(/\/+$/, "");
            $.ajax({
              url: appUrl + "/api/calls/" + currentCallId + "/hangup",
              type: "POST"
            });
          }
          openFeedbackModal();
        });

        return true;
      },
      settings: function() {
        return true;
      },
      onSave: function() {
        return true;
      },
      destroy: function() {
        if (callTimerInterval) clearInterval(callTimerInterval);
        $("#kvh_modal_overlay").remove();
      }
    };

    return this;
  };

  return CustomWidget;
});
