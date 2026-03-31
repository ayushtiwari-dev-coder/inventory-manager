import matplotlib.pyplot as plt

class graph:
    @staticmethod
    def revenue_graph(dates,revenue,months):
        plt.figure(figsize=(10,5))
        plt.plot(dates,revenue,marker="o",color="blue",label="Revenue")
        plt.title(f"Revenue--LAST {months} months")
        plt.xlabel("dates")
        plt.ylabel("Amount")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.legend()
        plt.show()
    @staticmethod
    def profit_graph(dates,profit,months):
        plt.figure(figsize=(10,5))
        plt.plot(dates,profit,marker="o",color="blue",label="Revenue")
        plt.title(f"Profit--LAST {months} months")
        plt.xlabel("dates")
        plt.ylabel("Amount")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.legend()
        plt.show()