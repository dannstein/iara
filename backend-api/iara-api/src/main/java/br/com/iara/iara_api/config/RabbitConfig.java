package br.com.iara.iara_api.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {

    public static final String EXCHANGE = "iara.events";
    public static final String NOTIF_QUEUE = "iara.notificacoes";
    public static final String NOTIF_ROUTING = "notif.#";

    // Alertas (Fase 1)
    public static final String ALERTS_QUEUE = "iara.alerts";
    public static final String ALERTS_ROUTING = "alert.#";
    public static final String ALERTS_DLQ_EXCHANGE = "iara.alerts.dlq.exchange";
    public static final String ALERTS_DLQ = "iara.alerts.dlq";

    // Filas do PC (Sub-fase 4E) — priority queues; eventos de campo > admin.
    public static final String PC_LIFECYCLE_QUEUE = "iara.pc.lifecycle";
    public static final String PC_LIFECYCLE_ROUTING = "pc.evento.#";
    public static final String PC_SOLICITACAO_QUEUE = "iara.pc.solicitacao";
    public static final String PC_SOLICITACAO_ROUTING = "pc.solicitacao.#";
    public static final String PC_DOACAO_QUEUE = "iara.pc.doacao";
    public static final String PC_DOACAO_ROUTING = "pc.doacao.#";
    public static final String PC_WORKER_QUEUE = "iara.pc.worker";
    public static final String PC_WORKER_ROUTING = "pc.worker.#";
    public static final String PC_ESTOQUE_QUEUE = "iara.pc.estoque";
    public static final String PC_ESTOQUE_ROUTING = "pc.estoque.#";
    public static final String PC_DLQ_EXCHANGE = "iara.pc.dlq.exchange";
    public static final String PC_DLQ = "iara.pc.dlq";

    @Bean
    public TopicExchange iaraExchange() {
        return new TopicExchange(EXCHANGE, true, false);
    }

    @Bean
    public Queue notificacoesQueue() {
        return QueueBuilder.durable(NOTIF_QUEUE).build();
    }

    @Bean
    public Binding notificacoesBinding(Queue notificacoesQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(notificacoesQueue).to(iaraExchange).with(NOTIF_ROUTING);
    }

    // ---------------------------------------------------------------- Alerts
    @Bean
    public DirectExchange alertsDlqExchange() {
        return new DirectExchange(ALERTS_DLQ_EXCHANGE, true, false);
    }

    @Bean
    public Queue alertsDlq() {
        return QueueBuilder.durable(ALERTS_DLQ).build();
    }

    @Bean
    public Binding alertsDlqBinding(Queue alertsDlq, DirectExchange alertsDlqExchange) {
        return BindingBuilder.bind(alertsDlq).to(alertsDlqExchange).with(ALERTS_DLQ);
    }

    @Bean
    public Queue alertsQueue() {
        // Failed messages (after retries) flow to alerts DLQ
        return QueueBuilder.durable(ALERTS_QUEUE)
                .withArgument("x-dead-letter-exchange", ALERTS_DLQ_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", ALERTS_DLQ)
                .build();
    }

    @Bean
    public Binding alertsBinding(Queue alertsQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(alertsQueue).to(iaraExchange).with(ALERTS_ROUTING);
    }

    // ---------------------------------------------------------------- PC subsystem (4E)

    @Bean
    public DirectExchange pcDlqExchange() {
        return new DirectExchange(PC_DLQ_EXCHANGE, true, false);
    }

    @Bean
    public Queue pcDlq() {
        return QueueBuilder.durable(PC_DLQ).build();
    }

    @Bean
    public Binding pcDlqBinding(Queue pcDlq, DirectExchange pcDlqExchange) {
        return BindingBuilder.bind(pcDlq).to(pcDlqExchange).with(PC_DLQ);
    }

    /** Priority queue helper. priority 1 = padrão; 5 = field-priority. */
    private Queue pcQueue(String name, int maxPriority) {
        return QueueBuilder.durable(name)
                .withArgument("x-dead-letter-exchange", PC_DLQ_EXCHANGE)
                .withArgument("x-dead-letter-routing-key", PC_DLQ)
                .withArgument("x-max-priority", maxPriority)
                .build();
    }

    @Bean public Queue pcLifecycleQueue() { return pcQueue(PC_LIFECYCLE_QUEUE, 5); }
    @Bean public Binding pcLifecycleBinding(Queue pcLifecycleQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(pcLifecycleQueue).to(iaraExchange).with(PC_LIFECYCLE_ROUTING);
    }

    @Bean public Queue pcSolicitacaoQueue() { return pcQueue(PC_SOLICITACAO_QUEUE, 5); }
    @Bean public Binding pcSolicitacaoBinding(Queue pcSolicitacaoQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(pcSolicitacaoQueue).to(iaraExchange).with(PC_SOLICITACAO_ROUTING);
    }

    @Bean public Queue pcDoacaoQueue() { return pcQueue(PC_DOACAO_QUEUE, 3); }
    @Bean public Binding pcDoacaoBinding(Queue pcDoacaoQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(pcDoacaoQueue).to(iaraExchange).with(PC_DOACAO_ROUTING);
    }

    @Bean public Queue pcWorkerQueue() { return pcQueue(PC_WORKER_QUEUE, 3); }
    @Bean public Binding pcWorkerBinding(Queue pcWorkerQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(pcWorkerQueue).to(iaraExchange).with(PC_WORKER_ROUTING);
    }

    @Bean public Queue pcEstoqueQueue() { return pcQueue(PC_ESTOQUE_QUEUE, 2); }
    @Bean public Binding pcEstoqueBinding(Queue pcEstoqueQueue, TopicExchange iaraExchange) {
        return BindingBuilder.bind(pcEstoqueQueue).to(iaraExchange).with(PC_ESTOQUE_ROUTING);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory cf, MessageConverter converter) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(converter);
        return template;
    }
}
