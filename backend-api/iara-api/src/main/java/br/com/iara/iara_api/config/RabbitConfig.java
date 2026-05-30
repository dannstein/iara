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
