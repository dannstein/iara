package br.com.iara.iara_api.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
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
