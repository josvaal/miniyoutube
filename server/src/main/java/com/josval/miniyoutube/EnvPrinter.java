import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

@Component
public class EnvPrinter {
  @Autowired
  public EnvPrinter(ApplicationContext ctx) {
    System.out.println("MONGODB_ADMIN_USERNAME=" + System.getenv("MONGODB_ADMIN_USERNAME"));
    System.out.println("MONGODB_ADMIN_PASSWORD=" + System.getenv("MONGODB_ADMIN_PASSWORD"));
  }
}
